export default function CustomIcon({ icon: Icon, dir = 'left' }: ICustomIcon) {
    return (
        /* Added a space after bg-[#007a8c] */
        <div className={`bg-[#007a8c] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25),0_4px_10px_rgba(0,0,0,0.15)] p-2 aspect-square rounded-lg text-white ${dir === 'left' ? '-rotate-15' : 'rotate-15'}`}>
            <Icon size={24} />
        </div>
    )
}