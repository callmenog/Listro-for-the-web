/* ===========================================================================
   ICONS
   Small inline-SVG icon set (kept monochrome/flat to match Breeze style).
   =========================================================================== */
const ICONS = {
  terminal: `<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="18" rx="2" fill="#151719" stroke="#4d4d4d"/><path d="M6 8l4 4-4 4" stroke="#3daee9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="16" x2="18" y2="16" stroke="#eff0f1" stroke-width="2" stroke-linecap="round"/></svg>`,
  folder: `<svg viewBox="0 0 24 24"><path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6z" fill="#3daee9"/><path d="M3 8h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8z" fill="#5fbfef"/></svg>`,
  file: `<svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6z" fill="#dfe3e6"/><path d="M15 2v5h5" fill="#b7bcc0"/><line x1="8.5" y1="12" x2="17" y2="12" stroke="#8a8f93"/><line x1="8.5" y1="15" x2="17" y2="15" stroke="#8a8f93"/><line x1="8.5" y1="18" x2="14" y2="18" stroke="#8a8f93"/></svg>`,
  editor: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#dfe3e6"/><path d="M7 8h10M7 12h10M7 16h6" stroke="#3daee9" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  start: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1.5" fill="#3daee9"/><rect x="13" y="3" width="8" height="8" rx="1.5" fill="#eff0f1"/><rect x="3" y="13" width="8" height="8" rx="1.5" fill="#eff0f1"/><rect x="13" y="13" width="8" height="8" rx="1.5" fill="#3daee9"/></svg>`,
  about: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3daee9"/><rect x="11" y="10" width="2" height="7" rx="1" fill="#fff"/><rect x="11" y="6.5" width="2" height="2" rx="1" fill="#fff"/></svg>`
};

/* ===========================================================================
   EDIT HERE #4 — FAKE FILE SYSTEM
   This object is the single "disk" shared by both the Terminal and Dolphin.
   Add/rename folders and files here to change what's pre-installed.
   type: "folder" -> has `children` (object keyed by name)
   type: "file"   -> has `content` (string shown in the text editor)
   =========================================================================== */
const FS = {
  type: "folder",
  children: {
    "Home": {
      type: "folder",
      children: {
        "Desktop":   { type: "folder", children: {} },
        "Documents": { type: "folder", children: {
          "welcome.txt": { type:"file", content:
            "Welcome to Listro OS (web edition).\n\n" +
            "This is a lightweight browser desktop styled after KDE Plasma.\n" +
            "Included apps: Terminal, Dolphin (file manager), Text Editor.\n" +
            "Everything you edit here lives only in this browser tab.\n"
          }
        }},
        "Downloads": { type: "folder", children: {} }
      }
    }
  }
};

/* Helpers to walk the FS tree using a path array, e.g. ["Home","Documents"] */
function fsGet(path){
  let node = FS;
  for(const seg of path){
    if(node.type !== "folder" || !node.children[seg]) return null;
    node = node.children[seg];
  }
  return node;
}
function fsPathStr(path){ return "/" + path.join("/"); }

/* ===========================================================================
   EDIT HERE #5 — APP REGISTRY
   Every app on the desktop / start menu / taskbar comes from this list.
   To add a new app: add an entry here with an id, name, icon and a
   `launch()` function that returns HTML (or attaches behavior) for the
   window body. To remove an app, delete its entry.
   =========================================================================== */
const APPS = [
  {
    id: "terminal",
    name: "Terminal",
    icon: ICONS.terminal,
    width: 620, height: 380,
    launch(body){ initTerminal(body); }
  },
  {
    id: "dolphin",
    name: "Dolphin",
    icon: ICONS.folder,
    width: 640, height: 420,
    launch(body){ initFileManager(body, ["Home"]); }
  },
  {
    id: "editor",
    name: "Text Editor",
    icon: ICONS.editor,
    width: 560, height: 420,
    launch(body){ initEditor(body, null); }
  },
  {
    id: "about",
    name: "About Listro",
    icon: ICONS.about,
    width: 480, height: 420,
    launch(body){ initAbout(body); }
  }
];

/* ===========================================================================
   WINDOW MANAGER
   Generic create/drag/focus/close logic used by every app above.
   =========================================================================== */
const winContainer = document.getElementById("windows-container");
const taskList = document.getElementById("task-list");
let zTop = 10;
let openCount = 0;

function createWindow(app, extraTitle){
  openCount++;
  const winEl = document.createElement("div");
  winEl.className = "window active";
  const startLeft = 80 + (openCount % 6) * 30;
  const startTop  = 60 + (openCount % 6) * 26;
  winEl.style.left = startLeft + "px";
  winEl.style.top  = startTop + "px";
  winEl.style.width  = (app.width||520) + "px";
  winEl.style.height = (app.height||360) + "px";
  winEl.style.zIndex = ++zTop;

  winEl.innerHTML = `
    <div class="titlebar">
      <span class="app-icon">${app.icon}</span>
      <span class="title-text">${extraTitle ? app.name + " — " + extraTitle : app.name}</span>
      <button class="win-btn minimize" title="Minimize">&#8211;</button>
      <button class="win-btn maximize" title="Maximize">&#9633;</button>
      <button class="win-btn close" title="Close">&#10005;</button>
    </div>
    <div class="window-body"></div>
    <div class="resize-handle"></div>
  `;
  winContainer.appendChild(winEl);

  const titlebar = winEl.querySelector(".titlebar");
  const body = winEl.querySelector(".window-body");
  const titleTextEl = winEl.querySelector(".title-text");

  // taskbar entry ----------------------------------------------------------
  const taskBtn = document.createElement("div");
  taskBtn.className = "task-btn focused";
  taskBtn.innerHTML = `${app.icon}<span>${app.name}</span>`;
  taskList.appendChild(taskBtn);

  function focus(){
    document.querySelectorAll(".window").forEach(w=>w.classList.remove("active"));
    document.querySelectorAll(".task-btn").forEach(b=>b.classList.remove("focused"));
    winEl.classList.add("active");
    taskBtn.classList.add("focused");
    winEl.style.zIndex = ++zTop;
  }
  winEl.addEventListener("mousedown", focus);
  taskBtn.addEventListener("click", ()=>{
    if(winEl.style.display === "none"){ winEl.style.display = "flex"; }
    focus();
  });

  // dragging -----------------------------------------------------------------
  titlebar.addEventListener("mousedown", (e)=>{
    if(e.target.closest(".win-btn")) return;
    const startX = e.clientX, startY = e.clientY;
    const origLeft = winEl.offsetLeft, origTop = winEl.offsetTop;
    function onMove(ev){
      winEl.style.left = (origLeft + ev.clientX - startX) + "px";
      winEl.style.top  = Math.max(0, origTop + ev.clientY - startY) + "px";
    }
    function onUp(){ document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  // resizing -------------------------------------------------------------------
  const handle = winEl.querySelector(".resize-handle");
  handle.addEventListener("mousedown", (e)=>{
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const origW = winEl.offsetWidth, origH = winEl.offsetHeight;
    function onMove(ev){
      winEl.style.width  = Math.max(320, origW + ev.clientX - startX) + "px";
      winEl.style.height = Math.max(220, origH + ev.clientY - startY) + "px";
    }
    function onUp(){ document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  // window control buttons ------------------------------------------------------
  winEl.querySelector(".close").addEventListener("click", ()=>{
    winEl.remove(); taskBtn.remove();
  });
  winEl.querySelector(".minimize").addEventListener("click", ()=>{
    winEl.style.display = "none"; taskBtn.classList.remove("focused");
  });
  let maximized = false, preMax = null;
  winEl.querySelector(".maximize").addEventListener("click", ()=>{
    if(!maximized){
      preMax = { left:winEl.style.left, top:winEl.style.top, width:winEl.style.width, height:winEl.style.height };
      winEl.style.left = "0px"; winEl.style.top = "0px";
      winEl.style.width = "100%"; winEl.style.height = "calc(100% - 40px)";
    } else {
      Object.assign(winEl.style, preMax);
    }
    maximized = !maximized;
  });

  focus();
  app.launch(body, (newTitle)=>{ titleTextEl.textContent = app.name + (newTitle ? " — " + newTitle : ""); });
  return winEl;
}

/* ===========================================================================
   TERMINAL APP
   EDIT HERE #6 — add new shell commands inside the COMMANDS object.
   Each command receives `args` (the words typed after the command name)
   and returns the string to print, or null to print nothing.
   =========================================================================== */

/* Recursively walks the FS tree, calling onFile(path[], name, node) for
   every file and onFolder(path[], name, node) for every folder.
   Used by find / tree / du / grep so they don't need their own walkers. */
function fsWalk(startPath, onFolder, onFile){
  function walk(path){
    const node = fsGet(path);
    if(!node || node.type!=="folder") return;
    for(const name of Object.keys(node.children)){
      const child = node.children[name];
      const childPath = [...path, name];
      if(child.type==="folder"){ onFolder(childPath, name, child); walk(childPath); }
      else { onFile(childPath, name, child); }
    }
  }
  walk(startPath);
}

function initTerminal(body){
  body.innerHTML = `<div class="term"><div id="term-log"></div>
    <div class="term-input-row">
      <span class="prompt" id="term-prompt">listro@web:~$</span>
      <input class="term-input" id="term-input" autocomplete="off" spellcheck="false">
    </div></div>`;
  const term = body.querySelector(".term");
  const log = body.querySelector("#term-log");
  const input = body.querySelector("#term-input");
  const promptEl = body.querySelector("#term-prompt");
  let cwd = ["Home"];
  let cmdHistory = [];     // typed commands, for the up/down arrow recall
  let historyPos = 0;

  function printLine(text){
    const d = document.createElement("div");
    d.className = "line";
    d.textContent = text;
    log.appendChild(d);
    term.scrollTop = term.scrollHeight;
  }
  function updatePrompt(){
    promptEl.textContent = `listro@web:~${cwd.length>1 ? "/"+cwd.slice(1).join("/") : ""}$`;
  }

  /* Short man-page style blurbs shown by `man <command>` */
  const MANUAL = {
    ls:"ls [dir] — list files and folders in the current (or given) directory.",
    cd:"cd <dir> — change directory. 'cd ..' goes up one level, 'cd' alone goes home.",
    cat:"cat <file> — print a file's contents.",
    mkdir:"mkdir <name> — create a new folder.",
    touch:"touch <name> — create a new empty file.",
    rm:"rm <name> — delete a file (add -r to also delete a folder and everything in it).",
    cp:"cp <source> <dest> — copy a file to a new name in the same folder.",
    mv:"mv <source> <dest> — rename/move a file within the current folder.",
    find:"find <name> — search this folder and all subfolders for a matching file/folder name.",
    grep:"grep <text> <file> — print lines of a file that contain the given text.",
    wc:"wc <file> — show line, word, and character counts for a file.",
    head:"head <file> [n] — print the first n lines of a file (default 5).",
    tail:"tail <file> [n] — print the last n lines of a file (default 5).",
    tree:"tree — draw the folder/file structure starting at the current directory.",
    du:"du — show how much space each item in the current folder is using.",
    df:"df — show fake overall disk usage for the system.",
    ps:"ps — list the (simulated) running processes.",
    uname:"uname -a — print system/kernel information.",
    neofetch:"neofetch — show a quick summary of the Listro OS system.",
    history:"history — list previously typed commands.",
    echo:"echo <text> — print text back to the terminal.",
    pwd:"pwd — print the current working directory path.",
    whoami:"whoami — print the current user name.",
    date:"date — print the current date and time.",
    clear:"clear — clear the terminal screen."
  };

  const COMMANDS = {
    help: ()=> "Commands: ls, cd, cat, mkdir, touch, rm, cp, mv, find, grep, wc, head, tail, " +
                "tree, du, df, ps, uname, neofetch, history, man, echo, pwd, whoami, date, clear, help",
    man: (args)=> args[0] ? (MANUAL[args[0]] || `No manual entry for ${args[0]}`) : "usage: man <command>",
    pwd:  ()=> fsPathStr(cwd),
    whoami: ()=> "listro",
    date: ()=> new Date().toString(),
    clear: ()=> { log.innerHTML = ""; return null; },
    history: ()=> cmdHistory.length ? cmdHistory.map((c,i)=> `${i+1}  ${c}`).join("\n") : "(no history yet)",

    uname: (args)=> (args[0]==="-a" || args.length===0)
      ? "Listro OS 1.0 web-preview x86_64 (Plasma minimal edition)"
      : "Listro",

    ps: ()=> [
      "PID   CMD",
      "1     plasmashell",
      "2     kwin_x11",
      "3     dolphin",
      "4     konsole",
      "5     kate"
    ].join("\n"),

    df: ()=> [
      "Filesystem     Size  Used  Avail  Use%",
      "/dev/listro1   20G   4.1G  14.9G   22%"
    ].join("\n"),

    neofetch: ()=> [
      "        /\\        listro@web",
      "       /  \\       -----------",
      "      / /\\ \\      OS: Listro OS 1.0 (web preview)",
      "     / ____ \\     DE: KDE Plasma (minimal)",
      "    /_/    \\_\\    Shell: listro-sh",
      "                  Apps: Terminal, Dolphin, Text Editor"
    ].join("\n"),

    ls: (args)=>{
      const node = fsGet(cwd);
      if(!node || node.type!=="folder") return "not a directory";
      const names = Object.keys(node.children);
      return names.length ? names.map(n=> node.children[n].type==="folder" ? n+"/" : n).join("   ") : "(empty)";
    },

    cd: (args)=>{
      if(args.length===0){ cwd=["Home"]; updatePrompt(); return null; }
      const target = args[0];
      if(target===".."){ if(cwd.length>1) cwd.pop(); updatePrompt(); return null; }
      const node = fsGet(cwd);
      if(node && node.children[target] && node.children[target].type==="folder"){
        cwd = [...cwd, target]; updatePrompt(); return null;
      }
      return `cd: no such directory: ${target}`;
    },

    mkdir: (args)=>{
      if(!args[0]) return "usage: mkdir <name>";
      const node = fsGet(cwd);
      node.children[args[0]] = { type:"folder", children:{} };
      return null;
    },

    touch: (args)=>{
      if(!args[0]) return "usage: touch <name>";
      const node = fsGet(cwd);
      if(!node.children[args[0]]) node.children[args[0]] = { type:"file", content:"" };
      return null;
    },

    rm: (args)=>{
      if(!args[0]) return "usage: rm [-r] <name>";
      const recursive = args[0] === "-r";
      const name = recursive ? args[1] : args[0];
      if(!name) return "usage: rm [-r] <name>";
      const node = fsGet(cwd);
      const target = node.children[name];
      if(!target) return `rm: ${name}: No such file or directory`;
      if(target.type==="folder" && !recursive && Object.keys(target.children).length>0)
        return `rm: ${name}: is a directory (use rm -r to remove it)`;
      delete node.children[name];
      return null;
    },

    cp: (args)=>{
      if(args.length<2) return "usage: cp <source> <dest>";
      const node = fsGet(cwd);
      const src = node.children[args[0]];
      if(!src) return `cp: ${args[0]}: No such file`;
      if(src.type==="folder") return "cp: copying folders isn't supported, only files";
      node.children[args[1]] = { type:"file", content: src.content };
      return null;
    },

    mv: (args)=>{
      if(args.length<2) return "usage: mv <source> <dest>";
      const node = fsGet(cwd);
      const src = node.children[args[0]];
      if(!src) return `mv: ${args[0]}: No such file or directory`;
      node.children[args[1]] = src;
      delete node.children[args[0]];
      return null;
    },

    cat: (args)=>{
      if(!args[0]) return "usage: cat <file>";
      const node = fsGet(cwd);
      const f = node.children[args[0]];
      if(!f) return `cat: ${args[0]}: No such file`;
      if(f.type==="folder") return `cat: ${args[0]}: Is a directory`;
      return f.content || "";
    },

    wc: (args)=>{
      if(!args[0]) return "usage: wc <file>";
      const node = fsGet(cwd);
      const f = node.children[args[0]];
      if(!f || f.type!=="file") return `wc: ${args[0]}: No such file`;
      const text = f.content || "";
      const lines = text ? text.split("\n").length : 0;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      return `${lines}  ${words}  ${text.length}  ${args[0]}`;
    },

    head: (args)=>{
      if(!args[0]) return "usage: head <file> [n]";
      const n = parseInt(args[1]) || 5;
      const node = fsGet(cwd);
      const f = node.children[args[0]];
      if(!f || f.type!=="file") return `head: ${args[0]}: No such file`;
      return (f.content||"").split("\n").slice(0,n).join("\n");
    },

    tail: (args)=>{
      if(!args[0]) return "usage: tail <file> [n]";
      const n = parseInt(args[1]) || 5;
      const node = fsGet(cwd);
      const f = node.children[args[0]];
      if(!f || f.type!=="file") return `tail: ${args[0]}: No such file`;
      const lines = (f.content||"").split("\n");
      return lines.slice(Math.max(0, lines.length-n)).join("\n");
    },

    /* file-scanning essentials --------------------------------------------- */
    find: (args)=>{
      if(!args[0]) return "usage: find <name>";
      const query = args[0].toLowerCase();
      const hits = [];
      // check the starting folder itself, then everything below it
      fsWalk(cwd,
        (path,name)=>{ if(name.toLowerCase().includes(query)) hits.push(fsPathStr(path)+"/"); },
        (path,name)=>{ if(name.toLowerCase().includes(query)) hits.push(fsPathStr(path)); }
      );
      return hits.length ? hits.join("\n") : `find: no matches for "${args[0]}"`;
    },

    grep: (args)=>{
      if(args.length<2) return "usage: grep <text> <file>";
      const [needle, filename] = args;
      const node = fsGet(cwd);
      const f = node.children[filename];
      if(!f || f.type!=="file") return `grep: ${filename}: No such file`;
      const matches = (f.content||"").split("\n").filter(l=> l.toLowerCase().includes(needle.toLowerCase()));
      return matches.length ? matches.join("\n") : `(no matches for "${needle}")`;
    },

    tree: ()=>{
      const lines = [fsPathStr(cwd) || "/"];
      function walk(path, prefix){
        const node = fsGet(path);
        const names = Object.keys(node.children);
        names.forEach((name, i)=>{
          const child = node.children[name];
          const last = i === names.length-1;
          lines.push(prefix + (last? "└── " : "├── ") + name + (child.type==="folder" ? "/" : ""));
          if(child.type==="folder") walk([...path,name], prefix + (last? "    " : "│   "));
        });
      }
      walk(cwd, "");
      return lines.join("\n");
    },

    du: ()=>{
      const node = fsGet(cwd);
      const rows = Object.keys(node.children).map(name=>{
        const item = node.children[name];
        let size;
        if(item.type==="file"){ size = (item.content||"").length; }
        else {
          size = 0;
          fsWalk([...cwd,name], ()=>{}, (p,n,f)=>{ size += (f.content||"").length; });
        }
        return `${String(size).padStart(6," ")}B  ${name}${item.type==="folder"?"/":""}`;
      });
      return rows.length ? rows.join("\n") : "(empty)";
    },

    echo: (args)=> args.join(" ")
  };

  input.addEventListener("keydown", (e)=>{
    if(e.key === "ArrowUp"){
      if(cmdHistory.length){ historyPos = Math.max(0, historyPos-1); input.value = cmdHistory[historyPos] || ""; }
      e.preventDefault(); return;
    }
    if(e.key === "ArrowDown"){
      if(cmdHistory.length){
        historyPos = Math.min(cmdHistory.length, historyPos+1);
        input.value = cmdHistory[historyPos] || "";
      }
      e.preventDefault(); return;
    }
    if(e.key !== "Enter") return;
    const raw = input.value;
    input.value = "";
    printLine(promptEl.textContent + " " + raw);
    const parts = raw.trim().split(/\s+/).filter(Boolean);
    if(parts.length===0) return;
    cmdHistory.push(raw.trim());
    historyPos = cmdHistory.length;
    const cmd = parts[0], args = parts.slice(1);
    if(COMMANDS[cmd]){
      const out = COMMANDS[cmd](args);
      if(out !== null && out !== undefined) printLine(out);
    } else {
      printLine(`${cmd}: command not found`);
    }
  });

  printLine("Listro OS terminal — type 'help' for a list of commands.");
  updatePrompt();
  setTimeout(()=>input.focus(), 50);
  body.addEventListener("mousedown", ()=> input.focus());
}


/* ===========================================================================
   DOLPHIN (FILE MANAGER) APP
   =========================================================================== */
function initFileManager(body, startPath){
  body.innerHTML = `<div class="fm">
    <div class="fm-toolbar">
      <button class="fm-back" title="Back">&#8592;</button>
      <button class="fm-up" title="Up">&#8593;</button>
      <div class="fm-path"></div>
    </div>
    <div class="fm-body"></div>
  </div>`;
  let path = [...startPath];
  let history = [];
  const pathEl = body.querySelector(".fm-path");
  const bodyGrid = body.querySelector(".fm-body");

  function render(){
    // breadcrumb
    pathEl.innerHTML = "";
    path.forEach((seg, i)=>{
      const s = document.createElement("span");
      s.className = "seg";
      s.textContent = (i===0 ? seg : " / " + seg);
      s.addEventListener("click", ()=>{ path = path.slice(0, i+1); render(); });
      pathEl.appendChild(s);
    });

    bodyGrid.innerHTML = "";
    const node = fsGet(path);
    if(!node){ bodyGrid.textContent = "This folder no longer exists."; return; }
    const names = Object.keys(node.children).sort((a,b)=>{
      const A = node.children[a], B = node.children[b];
      if(A.type!==B.type) return A.type==="folder" ? -1 : 1;
      return a.localeCompare(b);
    });
    if(names.length===0){
      bodyGrid.innerHTML = `<div style="color:var(--text-dim);padding:12px;">This folder is empty.</div>`;
      return;
    }
    names.forEach(name=>{
      const item = node.children[name];
      const el = document.createElement("div");
      el.className = "fm-item";
      el.innerHTML = `${item.type==="folder" ? ICONS.folder : ICONS.file}<span>${name}</span>`;
      el.addEventListener("dblclick", ()=>{
        if(item.type==="folder"){ path = [...path, name]; render(); }
        else { createWindow(APPS.find(a=>a.id==="editor"), name).querySelector; openEditorWindow(name, path); }
      });
      bodyGrid.appendChild(el);
    });
  }

  body.querySelector(".fm-up").addEventListener("click", ()=>{
    if(path.length>1){ path.pop(); render(); }
  });
  body.querySelector(".fm-back").addEventListener("click", ()=>{
    if(path.length>1){ path.pop(); render(); }
  });

  render();
}

/* Opens a dedicated Text Editor window pointed at a specific file path */
function openEditorWindow(filename, folderPath){
  const app = APPS.find(a=>a.id==="editor");
  const winEl = document.createElement("div"); // placeholder, real creation below
  createWindowForFile(filename, folderPath);
}
function createWindowForFile(filename, folderPath){
  const app = APPS.find(a=>a.id==="editor");
  const w = document.createElement("div");
  // Re-use createWindow but pass a launch closure bound to this file
  const customApp = { ...app, launch:(body, setTitle)=>{ initEditor(body, {filename, folderPath}, setTitle); } };
  createWindow(customApp, filename);
}

/* ===========================================================================
   TEXT EDITOR APP
   fileRef = { filename, folderPath } or null for a blank untitled document
   =========================================================================== */
function initEditor(body, fileRef, setTitle){
  body.innerHTML = `<div class="editor">
    <div class="editor-toolbar">
      <button class="ed-new">New</button>
      <button class="ed-save">Save</button>
      <span class="fname"></span>
    </div>
    <textarea spellcheck="false" placeholder="Start typing..."></textarea>
  </div>`;
  const textarea = body.querySelector("textarea");
  const fnameEl = body.querySelector(".fname");
  let ref = fileRef;

  function loadRef(){
    if(ref){
      const node = fsGet(ref.folderPath);
      const f = node.children[ref.filename];
      textarea.value = f ? f.content : "";
      fnameEl.textContent = fsPathStr(ref.folderPath) + "/" + ref.filename;
      if(setTitle) setTitle(ref.filename);
    } else {
      textarea.value = "";
      fnameEl.textContent = "Untitled";
      if(setTitle) setTitle(null);
    }
  }

  body.querySelector(".ed-save").addEventListener("click", ()=>{
    if(!ref){
      const name = prompt("Save as (file name):", "untitled.txt");
      if(!name) return;
      ref = { filename: name, folderPath: ["Home","Documents"] };
      const node = fsGet(ref.folderPath);
      node.children[name] = { type:"file", content:"" };
    }
    const node = fsGet(ref.folderPath);
    node.children[ref.filename].content = textarea.value;
    fnameEl.textContent = fsPathStr(ref.folderPath) + "/" + ref.filename + "  (saved)";
    if(setTitle) setTitle(ref.filename);
    setTimeout(loadRef, 900);
  });
  body.querySelector(".ed-new").addEventListener("click", ()=>{
    ref = null; loadRef();
  });

  loadRef();
}

/* ===========================================================================
   ABOUT LISTRO APP
   EDIT HERE #8 — change the description text or the ISO download link below.
   =========================================================================== */
function initAbout(body){
  body.innerHTML = `
    <div class="about">
      <div class="about-hero">
        <svg viewBox="0 0 24 24" class="about-logo"><circle cx="12" cy="12" r="10" fill="#3daee9"/><rect x="11" y="10" width="2" height="7" rx="1" fill="#fff"/><rect x="11" y="6.5" width="2" height="2" rx="1" fill="#fff"/></svg>
        <div>
          <h1>Listro OS</h1>
          <p class="about-tag">Linux Distribution — Plasma, stripped down.</p>
        </div>
      </div>

      <p>Listro is a Linux distribution built on <strong>KDE Plasma</strong>,
      configured to boot straight to a clean, minimal desktop instead of the
      full default Plasma experience. The goal is a fast, distraction-free
      workspace: only a terminal, a file manager, and a text editor ship by
      default, so the system stays light on resources and simple to learn.</p>

      <p>This page is a browser-based preview of that desktop — it recreates
      the look and the core apps so you can try the interaction model before
      installing the real thing on hardware or in a VM.</p>

      <p>Listro is aimed at people who want a Linux desktop that gets out of
      the way: developers who live in a terminal, low-spec machines that
      need a lighter footprint than a full desktop environment, and anyone
      who prefers to add only the apps they actually use.</p>

      <div class="about-cta">
        <p>Want the real desktop on your own machine?</p>
        <a href="https://github.com/callmenog/Listro-OS-" target="_blank" rel="noopener noreferrer" class="about-btn">
          Download the Listro OS ISO on GitHub &rarr;
        </a>
      </div>
    </div>`;
}

/* ===========================================================================
   DESKTOP ICONS + START MENU + TASKBAR CLOCK
   Built automatically from the APPS array above — no need to edit this
   section unless you want icons arranged differently.
   =========================================================================== */
const iconsContainer = document.getElementById("desktop-icons");
APPS.forEach(app=>{
  const el = document.createElement("div");
  el.className = "desktop-icon";
  el.innerHTML = `${app.icon}<span>${app.name}</span>`;
  el.addEventListener("dblclick", ()=> createWindow(app));
  iconsContainer.appendChild(el);
});

const startBtn = document.getElementById("start-button");
startBtn.innerHTML = `${ICONS.start}<span>Applications</span>`;
const startMenu = document.getElementById("start-menu");
startMenu.innerHTML = `<div class="start-menu-header">Applications</div>` +
  APPS.map(app=>`<div class="start-menu-item" data-id="${app.id}">${app.icon}<span>${app.name}</span></div>`).join("");
startMenu.querySelectorAll(".start-menu-item").forEach(item=>{
  item.addEventListener("click", ()=>{
    const app = APPS.find(a=>a.id===item.dataset.id);
    createWindow(app);
    startMenu.classList.add("hidden");
    startBtn.classList.remove("open");
  });
});
startBtn.addEventListener("click", (e)=>{
  e.stopPropagation();
  startMenu.classList.toggle("hidden");
  startBtn.classList.toggle("open");
});
document.addEventListener("click", (e)=>{
  if(!startMenu.contains(e.target) && e.target!==startBtn){
    startMenu.classList.add("hidden");
    startBtn.classList.remove("open");
  }
});

function tickClock(){
  const d = new Date();
  document.getElementById("clock").textContent =
    d.toLocaleDateString(undefined,{month:"short",day:"numeric"}) + "  " +
    d.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"});
}
tickClock();
setInterval(tickClock, 1000 * 15);

/* ===========================================================================
   EDIT HERE #7 — BOOT DURATION
   Time (ms) the splash screen stays visible before the desktop appears.
   Set to 0 to skip the boot screen entirely.
   =========================================================================== */
const BOOT_DURATION_MS = 900;
setTimeout(()=>{
  const boot = document.getElementById("boot-screen");
  boot.style.opacity = "0";
  setTimeout(()=> boot.remove(), 400);
}, BOOT_DURATION_MS);
