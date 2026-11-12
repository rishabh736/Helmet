const P={camera:"M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
shield:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",chart:"M18 20V10 M12 20V4 M6 20v-6",
alert:"M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z M12 9v4 M12 17h.01",
check:"M20 6 9 17l-5-5",cpu:"M4 4h16v16H4z M9 9h6v6H9z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 14h3 M1 9h3 M1 14h3",
image:"M3 3h18v18H3z M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M21 15l-5-5L5 21",
download:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",trash:"M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
play:"M5 3l14 9-14 9z",stop:"M6 6h12v12H6z",users:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
clock:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",bell:"M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0",
zap:"M13 2 3 14h9l-1 8 10-12h-9z",home:"M3 11l9-8 9 8 M5 10v10h14V10",info:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01",
list:"M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",server:"M2 3h20v7H2z M2 14h20v7H2z M6 7h.01 M6 17h.01",file:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",lock:"M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4",logout:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",filter:"M22 3H2l8 9.5V19l4 2v-8.5z",video:"M23 7l-7 5 7 5z M1 5h15v14H1z",target:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"};
export const Icon=({n,s=20})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[n].split(' M').map((d,i)=><path key={i} d={(i?'M':'')+d}/>)}</svg>;
export const PageHead=({icon,title,sub})=><div className="ph"><div className="ic"><Icon n={icon} s={24}/></div><div><h2>{title}</h2><p>{sub}</p></div></div>;
