/**
 * reminder.tools.ts
 *
 * Backend tools the agent can call. Every tool is scoped to a single
 * `userId` supplied by the authenticated session — the model can never pass
 * or override this value because it is bound into the closure when the tools
 * are built for a given request.
 *
 * EMAIL FEATURE:
 * - `resolveAttendees` is an OPTIONAL convenience: it looks up whether a
 *   bare name the user typed ("email Ali about this") already belongs to
 *   a registered platform user, so their email doesn't have to be typed
 *   out. It is never required — attendees can always be given directly.
 * - `createReminder`/`updateReminder` accept `attendees` as plain
 *   `{name, email}` pairs. The email does NOT need to belong to a
 *   platform user — meeting attendees are very often people who don't
 *   have an account at all.
 * - `createReminder` sends the appropriate email immediately (meeting
 *   notice to owner+attendees, or confirmation to the owner for
 *   everything else) and arms the 7d/3d/1d/2h/30m deadline emails.
 * - `updateReminder` re-arms deadline emails when the date/time changes,
 *   and can replace the attendee list for meetings.
 * - `deleteReminder`/`completeReminder` cancel any pending deadline emails.
 *
 * None of this is left to the LLM to decide — same as priority, it's
 * computed deterministically from `category`/`attendees` every time.
 */

import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import {
  Reminder,
  type ReminderPriority,
  type ReminderStatus,
} from "../../models/Reminder.model.js";
import User from "../../models/User.js";

import {
  calculatePriority,
  isValidDateTime,
} from "../../utils/Priority.util.js";

import {
  sendReminderConfirmationEmail,
} from "./Reminder.notifier.js";

import {
  scheduleDeadlineReminderEmails,
  clearScheduledEmails,
} from "./Reminder.scheduler.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface ToolContext {
  userId: string;
  timezone: string;
  now?: Date;
}

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Expected HH:mm (24h)");

function serialize(r: any) {
  return {
    id: r._id.toString(),
    task: r.task,
    date: r.date,
    time: r.time,
    priority: r.priority,
    status: r.status,
    category: r.category,
    notes: r.notes ?? null,
    attendees: (r.attendees ?? []).map((a: any) => ({
      name: a.name,
      email: a.email,
    })),
    notificationSent: r.notificationSent,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function isMeetingCategory(category?: string) {
  return (category ?? "").trim().toLowerCase() === "meeting";
}

/**
 * Marks active reminders whose deadline has passed as overdue/HIGH.
 * Called before every read so reminder views stay up to date.
 */
async function refreshOverdueStatuses(
  userId: string,
  tz: string,
  now?: Date
) {
  const active = await Reminder.find({
    userId,
    status: { $in: ["pending", "overdue"] },
  });

  for (const r of active) {
    const { priority, isOverdue } = calculatePriority({
      date: r.date,
      time: r.time,
      timezone: tz,
      now,
    });

    const nextStatus: ReminderStatus = isOverdue
      ? "overdue"
      : "pending";

    if (
      r.status !== nextStatus ||
      r.priority !== priority
    ) {
      r.status = nextStatus;
      r.priority = priority;

      await r.save();
    }
  }
}

export function buildReminderTools(ctx: ToolContext) {
  const { userId, timezone: tz, now } = ctx;

  /**
   * RESOLVE ATTENDEES
   */
  const resolveAttendees = new DynamicStructuredTool({
    name: "resolveAttendees",

    description:
      "Optional: look up whether a bare name (no email given) matches an existing platform user, to get their email. Skip if the user already gave an email. Returns up to 5 matches with name/email; if 0 or 2+ matches, ask the user for the email instead of guessing.",

    schema: z.object({
      names: z
        .array(z.string().min(1))
        .min(1)
        .describe("Names or partial names the user mentioned"),
    }),

    func: async ({ names }) => {
      const matches: Record<
        string,
        { userId: string; name: string; email: string }[]
      > = {};

      for (const name of names) {
        const found = await User.find({
          _id: { $ne: userId },
          name: { $regex: name.trim(), $options: "i" },
        })
          .select("_id name email")
          .limit(5);

        matches[name] = found.map((u: any) => ({
          userId: u._id.toString(),
          name: u.name,
          email: u.email,
        }));
      }

      return JSON.stringify({ matches });
    },
  });

  /**
   * CHECK DUPLICATE REMINDER
   */
  const checkDuplicateReminder = new DynamicStructuredTool({
    name: "checkDuplicateReminder",

    description:
      "Check for an existing active reminder with substantially the same task/date/time. Always call before createReminder.",

    schema: z.object({
      task: z
        .string()
        .min(1)
        .describe("The task description to check"),

      date: dateSchema,

      time: timeSchema,
    }),

    func: async ({ task, date, time }) => {
      const existing = await Reminder.findOne({
        userId,
        date,
        time,
        status: {
          $in: ["pending", "overdue"],
        },
        task: {
          $regex: task.trim(),
          $options: "i",
        },
      });

      return JSON.stringify({
        duplicateExists: !!existing,
        existing: existing
          ? serialize(existing)
          : null,
      });
    },
  });

  /**
   * CREATE REMINDER
   */
  const createReminder = new DynamicStructuredTool({
    name: "createReminder",

    description:
      "Create a reminder. Call after task/date/time are collected and checkDuplicateReminder passes. Omit notes (don't send null) when there are none. For Meeting reminders with people to notify, pass attendees as {name, email} — email need not belong to a platform user; this triggers an immediate email plus later deadline reminders. Other categories auto-email the owner only.",

    schema: z.object({
      task: z
        .string()
        .min(1)
        .describe("Short description of the task"),

      date: dateSchema,

      time: timeSchema,

      category: z
        .string()
        .optional()
        .describe(
          "Academic, Professional, Meeting, or a specific category; defaults to Other"
        ),

      /*
       * IMPORTANT:
       * nullable() allows the LLM to send null.
       * optional() allows the LLM to omit the field.
       */
      notes: z
        .string()
        .nullable()
        .optional()
        .describe(
          "Optional additional notes. Use null or omit this field when there are no notes."
        ),

      userStatedUrgent: z
        .boolean()
        .optional()
        .describe(
          "True if the user explicitly described this as urgent, critical, or extremely important"
        ),

      attendees: z
        .array(
          z.object({
            name: z.string().min(1),
            email: z.string().email(),
          })
        )
        .optional()
        .describe(
          "People to notify by email. {name, email} — need not be a platform user. Only relevant for Meeting."
        ),
    }),

    func: async ({
      task,
      date,
      time,
      category,
      notes,
      userStatedUrgent,
      attendees: attendeesInput,
    }) => {
      /**
       * Validate date/time using the user's timezone.
       */
      if (!isValidDateTime(date, time, tz)) {
        return JSON.stringify({
          success: false,
          error: "invalid_date_time",
        });
      }

      /**
       * Calculate priority automatically.
       */
      const { priority, isOverdue } =
        calculatePriority({
          date,
          time,
          timezone: tz,
          now,
          userStatedUrgent,
        });

      /**
       * Normalize notes.
       *
       * null -> undefined
       * ""   -> undefined
       * "abc" -> "abc"
       */
      const normalizedNotes =
        typeof notes === "string" && notes.trim()
          ? notes.trim()
          : undefined;

      const resolvedCategory = category?.trim() || "Other";

      /**
       * Attendees are only meaningful for Meeting-category reminders.
       * They're taken directly as {name, email} — no requirement that the
       * email belongs to a registered platform user. Attendees passed for
       * a non-meeting category are ignored on purpose — email routing is
       * driven by category, not by whatever the model happened to send.
       */
      const attendees: { name: string; email: string }[] =
        isMeetingCategory(resolvedCategory) && attendeesInput?.length
          ? attendeesInput.map((a) => ({
              name: a.name.trim(),
              email: a.email.trim().toLowerCase(),
            }))
          : [];

      const reminder = await Reminder.create({
        userId,

        task: task.trim(),

        date,

        time,

        category: resolvedCategory,

        notes: normalizedNotes,

        priority,

        status: isOverdue
          ? "overdue"
          : "pending",

        notificationSent: false,

        attendees,

        timezone: tz,
      });

      /**
       * Fire the immediate email (meeting notice or confirmation), and arm
       * the deadline-approaching checkpoints. Never let an email problem
       * fail the reminder creation itself.
       */
      try {
        await sendReminderConfirmationEmail({
          reminder,
          attendees,
          ownerUserId: userId,
        });

        reminder.notificationSent = true;
        await reminder.save();
      } catch (err) {
        console.error(
          "createReminder: confirmation email failed:",
          err
        );
      }

      try {
        scheduleDeadlineReminderEmails({
          reminder,
          timezone: tz,
        });
      } catch (err) {
        console.error(
          "createReminder: failed to schedule deadline emails:",
          err
        );
      }

      return JSON.stringify({
        success: true,
        reminder: serialize(reminder),
      });
    },
  });

  /**
   * GET ALL REMINDERS
   */
  const getReminders = new DynamicStructuredTool({
    name: "getReminders",

    description:
      "Get all of the authenticated user's reminders, optionally filtered by status.",

    schema: z.object({
      status: z
        .enum([
          "pending",
          "overdue",
          "completed",
          "cancelled",
          "all",
        ])
        .optional()
        .default("all"),
    }),

    func: async ({ status }) => {
      await refreshOverdueStatuses(
        userId,
        tz,
        now
      );

      const filter: Record<string, unknown> = {
        userId,
      };

      if (
        status &&
        status !== "all"
      ) {
        filter.status = status;
      }

      const reminders =
        await Reminder.find(filter).sort({
          date: 1,
          time: 1,
        });

      return JSON.stringify({
        reminders: reminders.map(serialize),
      });
    },
  });

  /**
   * GET TODAY'S REMINDERS
   */
  const getTodayReminders =
    new DynamicStructuredTool({
      name: "getTodayReminders",

      description:
        "Get the authenticated user's active reminders due on today's date in the user's timezone.",

      schema: z.object({}),

      func: async () => {
        await refreshOverdueStatuses(
          userId,
          tz,
          now
        );

        /**
         * IMPORTANT:
         * Use the application/user timezone instead of UTC.
         */
        const today = (
          now
            ? dayjs(now).tz(tz)
            : dayjs().tz(tz)
        ).format("YYYY-MM-DD");

        const reminders =
          await Reminder.find({
            userId,
            date: today,
            status: {
              $in: [
                "pending",
                "overdue",
              ],
            },
          }).sort({
            time: 1,
          });

        return JSON.stringify({
          reminders:
            reminders.map(serialize),
        });
      },
    });

  /**
   * GET UPCOMING REMINDERS
   */
  const getUpcomingReminders =
    new DynamicStructuredTool({
      name: "getUpcomingReminders",

      description:
        "Get the authenticated user's active pending or overdue reminders, sorted by priority and then earliest deadline. Excludes completed and cancelled reminders.",

      schema: z.object({}),

      func: async () => {
        await refreshOverdueStatuses(
          userId,
          tz,
          now
        );

        const reminders =
          await Reminder.find({
            userId,
            status: {
              $in: [
                "pending",
                "overdue",
              ],
            },
          });

        const order: Record<
          ReminderPriority,
          number
        > = {
          HIGH: 0,
          MEDIUM: 1,
          LOW: 2,
        };

        reminders.sort((a, b) => {
          if (
            order[a.priority] !==
            order[b.priority]
          ) {
            return (
              order[a.priority] -
              order[b.priority]
            );
          }

          return `${a.date}${a.time}`.localeCompare(
            `${b.date}${b.time}`
          );
        });

        return JSON.stringify({
          reminders:
            reminders.map(serialize),
        });
      },
    });

  /**
   * GET OVERDUE REMINDERS
   */
  const getOverdueReminders =
    new DynamicStructuredTool({
      name: "getOverdueReminders",

      description:
        "Get the authenticated user's overdue reminders.",

      schema: z.object({}),

      func: async () => {
        await refreshOverdueStatuses(
          userId,
          tz,
          now
        );

        const reminders =
          await Reminder.find({
            userId,
            status: "overdue",
          }).sort({
            date: 1,
            time: 1,
          });

        return JSON.stringify({
          reminders:
            reminders.map(serialize),
        });
      },
    });

  /**
   * GET MOST URGENT REMINDER
   */
  const getMostUrgentReminder =
    new DynamicStructuredTool({
      name: "getMostUrgentReminder",

      description:
        "Get the single active reminder with the closest deadline. Overdue reminders take precedence.",

      schema: z.object({}),

      func: async () => {
        await refreshOverdueStatuses(
          userId,
          tz,
          now
        );

        const overdue =
          await Reminder.find({
            userId,
            status: "overdue",
          })
            .sort({
              date: 1,
              time: 1,
            })
            .limit(1);

        if (overdue.length) {
          return JSON.stringify({
            mostUrgent:
              serialize(overdue[0]),
          });
        }

        const pending =
          await Reminder.find({
            userId,
            status: "pending",
          })
            .sort({
              date: 1,
              time: 1,
            })
            .limit(1);

        return JSON.stringify({
          mostUrgent: pending.length
            ? serialize(pending[0])
            : null,
        });
      },
    });

  /**
   * UPDATE REMINDER
   */
  const updateReminder =
    new DynamicStructuredTool({
      name: "updateReminder",

      description:
        "Update fields on an existing reminder. Only include fields the user asked to change. Priority and deadline emails re-arm automatically if date/time changes. To change meeting attendees, pass a new `attendees` list.",

      schema: z.object({
        reminderId: z
          .string()
          .describe(
            "The _id of the reminder to update"
          ),

        task: z.string().optional(),

        date: dateSchema.optional(),

        time: timeSchema.optional(),

        category: z.string().optional(),

        notes: z
          .string()
          .nullable()
          .optional(),

        userStatedUrgent:
          z.boolean().optional(),

        attendees: z
          .array(
            z.object({
              name: z.string().min(1),
              email: z.string().email(),
            })
          )
          .optional()
          .describe(
            "Replaces the current attendee list: {name, email} pairs, need not be platform users. Only relevant for Meeting."
          ),
      }),

      func: async ({
        reminderId,
        userStatedUrgent,
        attendees: attendeesInput,
        ...updates
      }) => {
        const reminder =
          await Reminder.findOne({
            _id: reminderId,
            userId,
          });

        if (!reminder) {
          return JSON.stringify({
            success: false,
            error: "not_found",
          });
        }

        const nextDate =
          updates.date ??
          reminder.date;

        const nextTime =
          updates.time ??
          reminder.time;

        if (
          (updates.date ||
            updates.time) &&
          !isValidDateTime(
            nextDate,
            nextTime,
            tz
          )
        ) {
          return JSON.stringify({
            success: false,
            error: "invalid_date_time",
          });
        }

        /**
         * Normalize notes when updating.
         */
        const normalizedUpdates = {
          ...updates,
          ...(updates.notes !== undefined
            ? {
                notes:
                  typeof updates.notes ===
                    "string" &&
                  updates.notes.trim()
                    ? updates.notes.trim()
                    : undefined,
              }
            : {}),
        };

        Object.assign(
          reminder,
          normalizedUpdates
        );

        /**
         * Update attendees if the caller provided a new list and the
         * (possibly just-updated) category is Meeting. Emails are used
         * directly — no requirement that they belong to a platform user.
         */
        if (
          attendeesInput &&
          isMeetingCategory(reminder.category)
        ) {
          reminder.attendees = attendeesInput.map((a) => ({
            name: a.name.trim(),
            email: a.email.trim().toLowerCase(),
          })) as any;
        }

        const dateOrTimeChanged =
          !!updates.date || !!updates.time;

        if (
          dateOrTimeChanged ||
          userStatedUrgent !==
            undefined
        ) {
          const {
            priority,
            isOverdue,
          } = calculatePriority({
            date: nextDate,
            time: nextTime,
            timezone: tz,
            now,
            userStatedUrgent,
          });

          reminder.priority =
            priority;

          if (
            reminder.status !==
              "completed" &&
            reminder.status !==
              "cancelled"
          ) {
            reminder.status =
              isOverdue
                ? "overdue"
                : "pending";
          }
        }

        /**
         * If the deadline actually moved, reset which checkpoints have
         * fired and re-arm fresh ones against the new date/time.
         */
        if (dateOrTimeChanged) {
          reminder.sentDeadlineReminders = [];
        }

        await reminder.save();

        if (
          dateOrTimeChanged &&
          reminder.status !== "completed" &&
          reminder.status !== "cancelled"
        ) {
          try {
            scheduleDeadlineReminderEmails({
              reminder,
              timezone: tz,
            });
          } catch (err) {
            console.error(
              "updateReminder: failed to re-schedule deadline emails:",
              err
            );
          }
        }

        return JSON.stringify({
          success: true,
          reminder:
            serialize(reminder),
        });
      },
    });

  /**
   * DELETE / CANCEL REMINDER
   */
  const deleteReminder =
    new DynamicStructuredTool({
      name: "deleteReminder",

      description:
        "Cancel a reminder belonging to the authenticated user.",

      schema: z.object({
        reminderId: z.string(),
      }),

      func: async ({
        reminderId,
      }) => {
        const reminder =
          await Reminder.findOne({
            _id: reminderId,
            userId,
          });

        if (!reminder) {
          return JSON.stringify({
            success: false,
            error: "not_found",
          });
        }

        reminder.status =
          "cancelled";

        await reminder.save();

        clearScheduledEmails(reminder._id.toString());

        return JSON.stringify({
          success: true,
          reminder:
            serialize(reminder),
        });
      },
    });

  /**
   * COMPLETE REMINDER
   */
  const completeReminder =
    new DynamicStructuredTool({
      name: "completeReminder",

      description:
        "Mark a reminder belonging to the authenticated user as completed.",

      schema: z.object({
        reminderId: z.string(),
      }),

      func: async ({
        reminderId,
      }) => {
        const reminder =
          await Reminder.findOne({
            _id: reminderId,
            userId,
          });

        if (!reminder) {
          return JSON.stringify({
            success: false,
            error: "not_found",
          });
        }

        reminder.status =
          "completed";

        await reminder.save();

        clearScheduledEmails(reminder._id.toString());

        return JSON.stringify({
          success: true,
          reminder:
            serialize(reminder),
        });
      },
    });

  return [
    resolveAttendees,
    checkDuplicateReminder,
    createReminder,
    getReminders,
    getTodayReminders,
    getUpcomingReminders,
    getOverdueReminders,
    getMostUrgentReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
  ];
}