// Updated App.jsx — removed large extra 'HOME' button on the Home page

import React, { useEffect, useMemo, useState } from "react";
import { HashRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"
import { FaLinkedin, FaGithub } from "react-icons/fa";
import { SiGooglescholar } from "react-icons/si";



const baseStyles = `
  :root{ --ink:#10212a; --mint:#1fd6c0; --mint-d:#15b2a5; --bg:#ffffff; --gray:#6b7b86; --glass:#e9fcf8; }
  *{ box-sizing:border-box }
  body{ margin:0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:var(--ink); background:var(--bg); }
  .pixel{ font-family: 'Press Start 2P', monospace; letter-spacing:0.5px }
  a{ color:inherit; text-decoration:none }
  .wrap{ max-width:1080px; margin:0 auto; padding:32px 20px }
  .grid{ display:grid; grid-template-columns: 1fr; gap:24px }
  @media(min-width:960px){ .grid{ grid-template-columns: 360px 1fr } }
  .hero-img{ width:100%; border-radius:8px; box-shadow:0 4px 0 #b7eae3, 0 0 0 4px var(--mint); }
  .nav{ position:sticky; top:0; backdrop-filter:saturate(120%) blur(6px); z-index:10; }
  .tabs{ display:flex; gap:8px; align-items:flex-end; justify-content:center; padding:14px 0 6px }
  .tab{ border:4px solid var(--mint); border-bottom-width:6px; padding:10px 18px; border-radius:14px; background:#fff; box-shadow:0 3px 0 #0e8d80; }
  .tab.active{ background:var(--mint); border-color:var(--mint); box-shadow:0 3px 0 var(--mint-d) }
  .tab .label{ font-weight:800; font-size:18px }
  .tab.active .label{ color:#06201c }
  .hello{ font-weight:800; font-size:18px; margin:0 0 14px }
  .lead{ font-size:22px; line-height:1.5; max-width:720px }
  .socials{ display:flex; gap:12px; margin-top:14px; flex-wrap:wrap }
  .chip{ display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border:3px solid #a7e8df; border-radius:10px; box-shadow:0 3px 0 #bfece6; }
  .chip .icon{ width:14px; height:14px; border-radius:3px; border:2px solid #6ad9cb }
  .h1{ font-size:28px; margin:0 0 18px; font-weight:800 }
  .panels{ display:grid; gap:18px }
  .panel{ border-radius:16px; padding:18px; border:4px solid rgba(0,0,0,0.06); box-shadow:0 4px 0 rgba(0,0,0,0.08) }
  .panel h3{ margin:0 0 10px; font-size:18px }
  .panel p{ margin:0 0 12px; line-height:1.6 }
  .fig{ border-radius:12px; border:3px solid rgba(0,0,0,0.08); width:80%; max-width:600px; margin:0 auto;}
  .caption{font-size:16px; font-weight: bold; color:#36525f; margin-top:6px }
  .code{ background:var(--glass); border:2px dashed #bfece6; padding:14px; border-radius:12px }
  .btn{ display:inline-block; padding:12px 16px; border:4px solid var(--mint); border-bottom-width:6px; border-radius:14px; box-shadow:0 3px 0 var(--mint-d) }

  /*** ▼▼▼ ADDED: custom panel layouts for Research ▼▼▼ ***/
  .panel-grid2 {
    display: grid;
    grid-template-columns: 1.3fr 1fr; /* left text | right stack */
    gap: 16px;
    max-width: 1000px;
    margin: 0 auto 32px;
    align-items: start;
  }

  .panel-grid3 {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr; /* left text | middle | right */
    gap: 16px;
    max-width: 1000px;
    margin: 0 auto 32px;
    align-items: start;
  }

  .stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /** Images in custom grids should fill their cell **/
  .panel-grid2 .fig,
  .panel-grid3 .fig { width:100%; max-width:none; height:auto; display:block; }

  /** Tighter body text for the left column **/
  .col-text p { font-size:14px; line-height:1.6; }

  /** Responsive: stack to one column on small screens **/
  @media (max-width: 900px) {
    .panel-grid2,
    .panel-grid3 { grid-template-columns: 1fr; }
  }
  /*** ▲▲▲ END ADDED ***/
`;

function StyleInjector(){
  useEffect(()=>{
    const s = document.createElement('style');
    s.innerHTML = baseStyles;
    document.head.appendChild(s);
    return ()=>{ document.head.removeChild(s) };
  },[]);
  return null;
}

function parsePanelTxt(raw) {
  const out = { title: "", description: "", figures: [] };
  const lines = String(raw).replace(/\r\n/g, "\n").split("\n");
  let mode = "header";

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Section headers
    if (trimmed.toLowerCase().startsWith("title:")) {
      out.title = trimmed.slice(6).trim();
      continue;
    }
    if (trimmed.toLowerCase().startsWith("description:")) {
      mode = "desc";
      continue;
    }
    if (trimmed.toLowerCase().startsWith("figures:")) {
      mode = "figs";
      continue;
    }

    if (mode === "desc") {
      // keep blank lines as paragraph breaks
      if (trimmed === "") {
        out.description += "\n\n";
      } else {
        out.description += (out.description === "" ? "" : "\n") + rawLine;
      }
      continue;
    }

    // ignore empty lines outside description
    if (!trimmed) continue;

    if (mode === "figs") {
      const m = /^-\s*(.*?)\s*\|\s*(.*)$/.exec(trimmed);
      if (m) out.figures.push({ src: m[1].trim(), caption: m[2].trim() });
    }
  }

  return out;
}



function usePanels() {
  const [panels, setPanels] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mods = import.meta.glob("/src/panels/*.txt", { as: "raw" });
        const entries = Object.entries(mods);
        if (entries.length === 0) throw new Error("no txt found");

        const loaded = [];
        for (const [path, loader] of entries) {
          const raw = await loader();
          // filename (e.g., "algal.txt" -> "algal")
          const id = path.split("/").pop().replace(".txt", "").toLowerCase();
          loaded.push({ id, ...parsePanelTxt(raw) });
        }

        // ✨ Customize display order here (use lowercase, match filenames)
        const order = ["larval", "algal", "whatif", "mps"];

        // Sort by your order; anything not listed goes after, alphabetically
        loaded.sort((a, b) => {
          const ia = order.indexOf(a.id);
          const ib = order.indexOf(b.id);
          if (ia === -1 && ib === -1) return a.id.localeCompare(b.id);
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        });

        if (alive) setPanels(loaded);
      } catch (err) {
        console.error("Error loading panels:", err);
      }
    })();
    return () => { alive = false; };
  }, []);

  // add alternating backgrounds here so it's inside the function
  const colors = ["#FFF9C4", "#E8F5E9", "#E0F7FA", "#F3E5F5", "#FFF3E0"];

  return useMemo(
    () => panels.map((p, i) => ({ ...p, _bg: colors[i % colors.length] })),
    [panels]
  );
}

function useActivePath() {
  const loc = useLocation();
  return loc.pathname.replace(/^\//, '') || 'home';
}



function Home(){
  return (
    <div className="wrap">
      <div className="grid">
        <div>
          <img src="/portrait.png" alt="Xing Zhou" className="hero-img" />
          <div className="socials">
  	    <a className="chip" href="https://www.linkedin.com/in/xing-zhou-39ab16202/" target="_blank" rel="noreferrer">
    	     <FaLinkedin style={{ color: "#0A66C2", width: "20px", height: "20px" }} />
    	     LinkedIn
  	    </a>

  	    <a className="chip" href="https://scholar.google.com/citations?user=1sSh4GAAAAAJ&hl=en" target="_blank" rel="noreferrer">
    	     <SiGooglescholar style={{ color: "#4285F4", width: "20px", height: "20px" }} />
             Google Scholar
            </a>

	    <a className="chip" href="https://github.com/xzhou473" target="_blank" rel="noreferrer">
    	     <FaGithub style={{ color: "#181717", width: "20px", height: "20px" }} />
             GitHub
            </a>
          </div>

        </div>
        <div>
          <h2 className="hello pixel">HELLO</h2>
          <p className="lead">My name is Xing Zhou — welcome to my website! I am a limnologist, oceanographer, and modeler exploring ecosystem dynamics and biogeochemical cycles in large water bodies, including lakes and oceans. I earned my Ph.D. in 2023 from Michigan Technological University under the supervision of Dr. Pengfei Xue and am currently a postdoctoral fellow at the Georgia Institute of Technology working with Dr. Annalisa Bracco. I have extensive experience in the development and applications of regional ocean models (e.g., FVCOM, CROCO), biogeochemical modules (e.g., PISCES), biophysical models (e.g., Ichthyop), as well as in incorporating them with advanced AI techniques.</p>
        </div>
      </div>
    </div>
  );
}

function Research(){
  const panels = usePanels();
  return (
    <div className="wrap">
      <h1 className="h1 pixel">RESEARCH</h1>
      <div className="panels">
        {/** Custom layouts per panel id: larval, algal, whatif; MPs = default */}
        {panels.map((p)=> {
          const figs = p.figures || [];
          const id = (p.id || "").toLowerCase();

          // LARVAL: left text | middle stack (all but last) | right = last fig
          if (id === "Larval") {
            const middle = figs.slice(0, Math.max(figs.length - 1, 0));
            const right = figs[figs.length - 1];
            return (
              <section key={p.id} className="panel panel-grid3" style={{ background:p._bg }}>
                <div className="col-text">
                  <h3 className="pixel" dangerouslySetInnerHTML={{__html: p.title}} />
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.description || ""}</ReactMarkdown>
                </div>

                <div className="stack">
                  {middle.map((f, idx) => (
                    <figure key={idx}>
                      <img className="fig" src={f.src} alt={f.caption || "figure"} />
                      {f.caption && <figcaption className="caption">{f.caption}</figcaption>}
                    </figure>
                  ))}
                </div>

                <div>
                  {right && (
                    <figure>
                      <img className="fig" src={right.src} alt={right.caption || "figure"} />
                      {right.caption && <figcaption className="caption">{right.caption}</figcaption>}
                    </figure>
                  )}
                </div>
              </section>
            );
          }

          // ALGAL: two columns → left text | right stacked figs (top & bottom)
          if (id === "algal") {
            return (
              <section key={p.id} className="panel panel-grid2" style={{ background:p._bg }}>
                <div className="col-text">
                  <h3 className="pixel" dangerouslySetInnerHTML={{__html: p.title}} />
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.description || ""}</ReactMarkdown>
                </div>
                <div className="stack">
                  {figs.map((f, idx) => (
                    <figure key={idx}>
                      <img className="fig" src={f.src} alt={f.caption || "figure"} />
                      {f.caption && <figcaption className="caption">{f.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </section>
            );
          }

          // WHATIF: 3 columns → left text | middle = first (big) fig | right = stacked remaining figs
          if (id === "whatif") {
            const big = figs[0];
            const side = figs.slice(1);
            return (
              <section key={p.id} className="panel panel-grid3" style={{ background:p._bg }}>
                <div className="col-text">
                  <h3 className="pixel" dangerouslySetInnerHTML={{__html: p.title}} />
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.description || ""}</ReactMarkdown>
                </div>

                <div>
                  {big && (
                    <figure>
                      <img className="fig" src={big.src} alt={big.caption || "figure"} />
                      {big.caption && <figcaption className="caption">{big.caption}</figcaption>}
                    </figure>
                  )}
                </div>

                <div className="stack">
                  {side.map((f, idx) => (
                    <figure key={idx}>
                      <img className="fig" src={f.src} alt={f.caption || "figure"} />
                      {f.caption && <figcaption className="caption">{f.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </section>
            );
          }

          // MPs: default layout (text on top, figures below)
          if (id === "mps") {
            return (
              <section key={p.id} className="panel panel-default" style={{ background:p._bg }}>
                <h3 className="pixel" dangerouslySetInnerHTML={{__html: p.title}} />
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.description || ""}</ReactMarkdown>
                {(figs || []).map((f,idx)=> (
                  <figure key={idx} style={{margin:0, marginBottom:12}}>
                    <img className="fig" src={f.src} alt={f.caption || "figure"} />
                    {f.caption && <figcaption className="caption">{f.caption}</figcaption>}
                  </figure>
                ))}
              </section>
            );
          }

          // DEFAULT: original stacked layout
          return (
            <section key={p.id} className="panel panel-default" style={{ background:p._bg }}>
              <h3 className="pixel" dangerouslySetInnerHTML={{__html: p.title}} />
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.description}</ReactMarkdown>
              {(p.figures || []).map((f,idx)=> (
                <figure key={idx} style={{margin:0, marginBottom:12}}>
                  <img className="fig" src={f.src} alt={f.caption} />
                  <figcaption className="caption">{f.caption}</figcaption>
                </figure>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Code() {
  return (
    <div className="wrap">
      <h1 className="h1 pixel">CODE</h1>

      <div className="code">
        <p>
          <strong>1.</strong> Eulerian tracer model built for forecasting
          cyanobacterial harmful algal bloom
          spatial distribution and its toxin compound,
          microcystin, in western Lake Erie.The model is adapted from FVCOM-GEM by deactivating all biogeochemical processes and including buoyant and sinking dynamics for algae.{" "}
          <br />
          Code:&nbsp;
          <a
            href="https://zenodo.org/records/8014770"
            target="_blank"
            rel="noreferrer"
          >
            https://zenodo.org/records/8014770
          </a>
        </p>

        <p>
          <strong>2.</strong> Particle tracking model used to simulate
          microplastic distribution in the northern Gulf of
          Mexico.The code is adapted from Ichthyop v3.3.16, with a modified buoyancy module that accounts for each individual microplastic’s density and size. As a result, each individual’s terminal sinking or floating velocity varies according to its own physical properties.{" "}
          <br />
          Code:&nbsp;
          <a
            href="https://zenodo.org/records/15685532"
            target="_blank"
            rel="noreferrer"
          >
            https://zenodo.org/records/15685532
          </a>
        </p>
        
         <p>
          <strong>3.</strong> IchthyopAgent: a generative AI-agent-based Lagrangian tool for modeling ichthyoplankton dynamics. It integrates Large Language Model (LLM) agents into a biophysical framework, using LLM agents to simulate active behaviors and Ichthyop v3.3.17 to represent passive drifting.{" "}	
          <br />
          Code:&nbsp;
          <a
            href="https://github.com/guanghui-wang-gatech/fish_llm"
            target="_blank"
            rel="noreferrer"
          > 
            https://github.com/guanghui-wang-gatech/fish_llm
          </a>
        </p>
        
      </div>
    </div>
  );
}


function CV(){
  return (
    <div className="wrap">
      <h1 className="h1 pixel">CV</h1>
      <p>Open my CV: {" "}
        <a className="btn" href="/cv/XingZhou_CV.pdf" target="_blank" rel="noreferrer">View CV (PDF)</a>
      </p>
    </div>
  );
}

function Nav(){
  const active = useActivePath();
  const item = (to, label)=> (
    <Link to={to} className={"tab" + (active===to.replace('/','')?" active":"")}>
      <span className="label pixel">{label}</span>
    </Link>
  );
  return (
    <div className="nav">
      <div className="tabs">
        {item('/home','HOME')}
        {item('/research','RESEARCH')}
        {item('/code','CODE')}
        {item('/cv','CV')}
      </div>
    </div>
  );
}

export default function App(){
  return (
    <HashRouter>
      <StyleInjector/>
      <Nav/>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/home" element={<Home/>} />
        <Route path="/research" element={<Research/>} />
        <Route path="/code" element={<Code/>} />
        <Route path="/cv" element={<CV/>} />
      </Routes>
    </HashRouter>
  );
}

