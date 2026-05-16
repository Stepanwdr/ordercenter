import{a as e,n as t,s as n,t as r,u as i}from"./jsx-runtime-D1CT_DlN.js";import{t as a}from"./Button-EnPxuzX1.js";var o=i(n(),1),s=r(),c=e.div`
  position: fixed;
  inset: 0;
  background: rgba(6, 10, 20, 0.72);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  z-index: 1100;
  opacity: ${({$visible:e})=>+!!e};
  pointer-events: ${({$visible:e})=>e?`auto`:`none`};
  transition: opacity 220ms ease;
`,l=t`
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`,u=t`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
`,d=t`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`,f=t`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`,p=t`
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`,m=t`
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(100%); opacity: 0; }
`,h=t`
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`,g=t`
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(-100%); opacity: 0; }
`,_=e.div`
    position: fixed;

    ${({position:e})=>{switch(e){case`bottom`:return`
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          max-height: 98vh;
          border-radius: 24px 24px 0 0;
        `;case`top`:return`
          left: 0;
          right: 0;
          top: 0;
          width: 100%;
          height: 100%;
          max-height: 98vh;
          border-radius: 0 0 24px 24px;
        `;case`left`:return`
          top: 0;
          bottom: 0;
          left: 0;
          width: 420px;
          max-width: 100%;
          height: 100%;
          border-radius: 0 24px 24px 0;
        `;case`right`:return`
          top: 0;
          bottom: 0;
          right: 0;
          width: 420px;
          max-width: 100%;
          height: 100%;
          border-radius: 24px 0 0 24px;
        `;default:return``}}}
    animation: ${({position:e,$visible:t})=>e===`bottom`?t?p:m:e===`top`?t?h:g:e===`left`?t?l:u:t?d:f} 260ms ease forwards;

    background: rgba(18, 24, 44, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.35);

    overflow: hidden;
    padding: 24px;

    will-change: transform, opacity;
`,v=e.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  max-height: 80px;
`,y=e.h2`
  margin: 0;
  font-size: 1.25rem;
`,b=e.div`
  overflow: auto;
`,x=({open:e,position:t=`bottom`,title:n,children:r,onClose:i,closeOnBackdropClick:l=!0})=>{let[u,d]=(0,o.useState)(e),[f,p]=(0,o.useState)(e);return(0,o.useEffect)(()=>{if(e){d(!0),requestAnimationFrame(()=>p(!0));return}p(!1);let t=window.setTimeout(()=>d(!1),260);return()=>window.clearTimeout(t)},[e]),u?(0,s.jsx)(c,{$visible:f,onClick:()=>{l&&i()},children:(0,s.jsxs)(_,{position:t,$visible:f,onClick:e=>e.stopPropagation(),children:[(0,s.jsxs)(v,{children:[(0,s.jsx)(y,{children:n??`Drawer`}),(0,s.jsx)(a,{variant:`ghost`,onClick:i,type:`button`,children:`Փակել`})]}),(0,s.jsx)(b,{children:r})]})}):null};export{x as t};