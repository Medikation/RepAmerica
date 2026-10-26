/** Styles for the public schedule (page + homepage strip). Same palette as the homepage hero: cream, ink, Rep America red. */
export const RED = "#c62436";

export const scheduleStyles = `
.ra-sched { background: linear-gradient(180deg, #ffffff 0%, #faf8f4 30%, #faf8f4 100%); color: #14140f; }
.ra-sched__inner { width: min(calc(100% - 48px), 1120px); margin: 0 auto; padding: 36px 0 72px; }
.ra-sched__eyebrow { display:flex; align-items:center; gap:8px; margin:0 0 14px; color: rgba(20,20,15,.62); font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; }
.ra-sched__dot { width:7px; height:7px; border-radius:50%; background:${RED}; }
.ra-sched__h1 { margin:0 0 14px; font-family: var(--font-heading-family, Georgia, serif); font-size: clamp(34px, 4.6vw, 60px); font-weight: var(--font-heading-weight, 700); line-height:1.02; letter-spacing:-.03em; }
.ra-sched__lead { margin:0; max-width: 62ch; font-size: clamp(15px, 1.3vw, 18px); line-height:1.5; color: rgba(20,20,15,.78); }
@media (max-width: 759px) { .ra-sched__inner { padding-top:22px; } .ra-sched__h1 { font-size:32px; } .ra-sched__h2-note { font-size:13px; } }
.ra-sched__actions { display:flex; flex-wrap:wrap; gap:10px 12px; margin:22px 0 0; }
.ra-sched__live-banner { display:flex; flex-wrap:wrap; align-items:center; gap:10px 18px; margin:28px 0 0; padding:14px 18px; border-radius:12px; background:#14140f; color:#fff; }
.ra-sched__live-banner strong { display:inline-flex; align-items:center; gap:8px; color:#fff; font-size:13px; letter-spacing:.14em; text-transform:uppercase; }
.ra-sched__live-banner strong::before { content:""; width:9px; height:9px; border-radius:50%; background:${RED}; box-shadow:0 0 0 0 rgba(198,36,54,.7); animation: ra-sched-pulse 1.6s infinite; }
.ra-sched__live-banner a.ra-button { background:${RED}; border-color:${RED}; color:#fff; }
@keyframes ra-sched-pulse { 0% { box-shadow:0 0 0 0 rgba(198,36,54,.7);} 70% { box-shadow:0 0 0 9px rgba(198,36,54,0);} 100% { box-shadow:0 0 0 0 rgba(198,36,54,0);} }
.ra-sched__section { margin-top:44px; }
.ra-sched__h2 { margin:0 0 6px; font-family: var(--font-heading-family, Georgia, serif); font-size: clamp(24px, 2.4vw, 32px); letter-spacing:-.02em; line-height:1.1; }
.ra-sched__h2-note { margin:0 0 18px; color: rgba(20,20,15,.6); font-size:14px; }
.ra-sched__day { margin:28px 0 4px; padding-bottom:6px; border-bottom:2px solid #14140f; font-size:14px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; }
.ra-sched__day--today { color:${RED}; border-color:${RED}; }
.ra-sched__list { list-style:none; margin:0; padding:0; }
.ra-sched__event { display:grid; grid-template-columns: 108px minmax(0,1fr); grid-template-areas: "time body" "time action"; gap:4px 14px; padding:14px 0; border-bottom:1px solid rgba(20,20,15,.12); scroll-margin-top:24px; }
.ra-sched__event .ra-sched__time { grid-area: time; } .ra-sched__event .ra-sched__body { grid-area: body; } .ra-sched__event .ra-sched__action { grid-area: action; }
@media (min-width: 760px) { .ra-sched__event { grid-template-columns: 118px minmax(0,1fr) auto; grid-template-areas: "time body action"; align-items:center; gap:6px 20px; padding:16px 0; } }
.ra-sched__kicker { margin:0 0 2px; display:flex; align-items:center; gap:8px; font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color: rgba(20,20,15,.55); }
.ra-sched__more { margin-top:6px; font-size:13.5px; }
.ra-sched__more summary { cursor:pointer; color: rgba(20,20,15,.55); font-size:12.5px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; list-style:none; display:inline-flex; align-items:center; gap:4px; }
.ra-sched__more summary::-webkit-details-marker { display:none; }
.ra-sched__more summary::after { content:"+"; font-size:14px; } .ra-sched__more[open] summary::after { content:"–"; }
.ra-sched__event--past { opacity:.82; }
.ra-sched__event--after { background: linear-gradient(90deg, rgba(198,36,54,.05), transparent 60%); }
@media (min-width: 760px) { .ra-sched__event--after .ra-sched__time { padding-left: 14px; border-left: 3px solid ${RED}; } }
.ra-sched__platform { display:inline-block; padding:2px 8px; border-radius:999px; font-family: var(--font-body-family, system-ui, sans-serif); font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; background:#14140f; color:#fff; }
.ra-sched__action .ra-sched__watch--tiktok.ra-button--primary { background:#14140f; border-color:#14140f; }
.ra-sched__doors { display:flex; flex-wrap:wrap; gap:8px 18px; margin:14px 0 0; font-size:14px; color: rgba(20,20,15,.7); }
.ra-sched__doors a { color:#14140f; font-weight:600; }
.ra-sched__event--canceled .ra-sched__name, .ra-sched__event--canceled .ra-sched__meta { text-decoration: line-through; color: rgba(20,20,15,.5); }
.ra-sched__time { display:flex; flex-direction:column; line-height:1.2; }
.ra-sched__time-day { font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color: rgba(20,20,15,.55); }
.ra-sched__time-et { font-weight:800; font-size:16px; color:#14140f; white-space:nowrap; letter-spacing:-.01em; }
@media (min-width: 760px) { .ra-sched__time-et { font-size:18px; } }
.ra-sched__time-pt { font-size:12px; color: rgba(20,20,15,.55); white-space:nowrap; }
.ra-sched__name { margin:0; font-family: var(--font-heading-family, Georgia, serif); font-size: clamp(20px, 1.8vw, 24px); line-height:1.15; letter-spacing:-.01em; }
.ra-sched__status { display:inline-block; padding:2px 8px; border-radius:999px; font-family: var(--font-body-family, system-ui, sans-serif); font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; border:1px solid rgba(20,20,15,.18); color: rgba(20,20,15,.7); background:#fff; }
.ra-sched__status--ok { border-color:#14140f; color:#14140f; }
.ra-sched__status--warn { border-color:#e0b24a; background:#fff6dc; color:#6b4e00; }
.ra-sched__status--live { border-color:${RED}; background:${RED}; color:#fff; }
.ra-sched__status--muted { color: rgba(20,20,15,.5); }
.ra-sched__meta { margin:6px 0 0; font-size:13.5px; line-height:1.45; color: rgba(20,20,15,.7); }
.ra-sched__source { margin:4px 0 0; font-size:12.5px; color: rgba(20,20,15,.55); }
.ra-sched__source a { color: inherit; }
.ra-sched__action { display:flex; flex-direction:row; flex-wrap:wrap; align-items:center; gap:6px 12px; margin-top:4px; }
.ra-sched__action .ra-button { min-height:38px; padding:8px 14px; font-size:12px; }
@media (min-width: 760px) { .ra-sched__action { flex-direction:column; margin-top:0; } .ra-sched__action .ra-button { min-height:44px; padding:11px 18px; font-size:13px; } }
@media (min-width: 760px) { .ra-sched__action { align-items:flex-end; } }
.ra-sched__watch { white-space:nowrap; }
.ra-sched__watch.ra-button--primary { background:${RED}; border-color:${RED}; }
.ra-sched__watch--live { animation: ra-sched-pulse 1.6s infinite; }
.ra-sched__alt { font-size:12.5px; color: rgba(20,20,15,.6); text-decoration: underline; text-underline-offset: 3px; }
.ra-sched__empty { padding:18px 0; color: rgba(20,20,15,.6); }
.ra-sched__about { margin-top:56px; padding-top:28px; border-top:1px solid rgba(20,20,15,.12); max-width:70ch; font-size:15px; line-height:1.6; color: rgba(20,20,15,.78); }
.ra-sched__about h2 { font-size:18px; margin:0 0 8px; }
.ra-sched__about p { margin:0 0 12px; }
.ra-sched__about a { color:#14140f; }
.ra-sched__feeds { display:flex; flex-wrap:wrap; gap:8px 18px; margin:0; padding:0; list-style:none; font-size:14px; }
.ra-sched__feeds a { color:#14140f; }
/* homepage strip */
.ra-home-sched__grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap:14px; margin-top:22px; }
.ra-home-sched__card { display:flex; flex-direction:column; gap:6px; padding:16px 18px; border:1px solid rgba(20,20,15,.12); border-radius:12px; background:#fff; text-decoration:none; color:#14140f; min-height:148px; }
.ra-home-sched__card--live { border-color:${RED}; box-shadow: 0 0 0 1px ${RED}; }
.ra-home-sched__when { font-size:12px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color: rgba(20,20,15,.55); }
.ra-home-sched__when b { color:#14140f; }
.ra-home-sched__name { margin:0; font-family: var(--font-heading-family, Georgia, serif); font-size:20px; line-height:1.2; letter-spacing:-.01em; }
.ra-home-sched__place { margin:0; font-size:13.5px; color: rgba(20,20,15,.65); }
.ra-home-sched__cta { margin-top:auto; padding-top:8px; font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:${RED}; }
.ra-home-sched__cta--muted { color: rgba(20,20,15,.5); }
`;
