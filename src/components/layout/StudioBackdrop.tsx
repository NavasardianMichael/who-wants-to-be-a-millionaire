/**
 * The studio set behind every page: deep navy gradients, two slow spotlight beams, a
 * perspective floor grid and a vignette. Pure CSS, rendered on the server, fixed behind the
 * content — it costs no JavaScript and is frozen under `prefers-reduced-motion`.
 */
export const StudioBackdrop = () => (
  <div aria-hidden className='pointer-events-none fixed inset-0 -z-10 overflow-hidden studio-backdrop'>
    <div className='absolute -top-[20%] left-[15%] h-[140%] w-[45%] origin-top animate-spotlight spotlight-beam' />
    <div className='absolute -top-[20%] right-[10%] h-[140%] w-[40%] origin-top animate-spotlight-reverse spotlight-beam opacity-70' />
    <div className='absolute inset-x-[-25%] bottom-0 h-[45%] floor-grid opacity-60' />
    <div className='absolute top-1/2 left-1/2 size-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-spot-500/5 blur-3xl' />
    <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--color-studio-950)_100%)]' />
  </div>
)
