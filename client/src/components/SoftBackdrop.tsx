const SoftBackdrop = () => {
    return (

        < div className='fixed inset-0 -z-1 pointer-events-none' >
            <div className='absolute left-1/2 top-20 -translate-x-1/2 w-245 h-115 bg-linear-to-tr from-sky-300 to-transparent rounded-full blur-3xl' />
            <div className='absolute right-12 bottom-10 w-105 h-55 bg-linear-to-bl from-sky-300/35 to-transparent rounded-full blur-2xl' />
        </div >
    )
}

export default SoftBackdrop
