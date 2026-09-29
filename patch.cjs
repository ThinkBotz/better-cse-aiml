const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');

css = css.replace(/body\s*{[^}]*}/, `body {
  font-family: var(--font-sans);
  background-color: var(--divider);
  color: var(--content);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  -webkit-user-select: none;
  user-select: none;
  touch-action: pan-y;
}

#root {
  width: 100%;
  max-width: 480px;
  height: 100dvh;
  margin: 0 auto;
  background-color: var(--background);
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}

@media (min-width: 481px) {
  #root {
    border-left: 1px solid var(--divider-light);
    border-right: 1px solid var(--divider-light);
  }
}

input, textarea {
  -webkit-user-select: auto;
  user-select: auto;
}`);

fs.writeFileSync('src/index.css', css);
