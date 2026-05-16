import{a as e,n as t,s as n,t as r,u as i}from"./jsx-runtime-D1CT_DlN.js";import{t as a}from"./react-dom-BQ0Ae3sl.js";import{t as o}from"./Button-EnPxuzX1.js";var s=i(n(),1),c=i(a(),1),l=r(),u=t`
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
`,d=e.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
`,f=e.div`
  position: absolute;
  top: ${({top:e})=>e}px;
  left: ${({left:e})=>e}px;
  width: ${({width:e})=>e}px;
  max-height: ${({maxHeight:e})=>e}px;
  background: rgb(17, 19, 24);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  box-shadow: 0 28px 40px rgba(55, 55, 55, 0.1);
  overflow: auto;
  animation: ${u} 180ms ease;
`,p=e.button`
  width: 100%;
  min-height: 46px;
  padding: 12px 16px;
  text-align: left;
  color: ${({selected:e})=>e?`#fff`:`rgba(255, 255, 255, 0.8)`};
  background: ${({selected:e})=>e?`rgba(79, 143, 255, 0.18)`:`transparent`};
  border: none;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`,m=e(o)`
  justify-content: space-between;
  display: flex;
  align-items: center;
  min-width: unset;
  min-height: ${({$asTableCell:e})=>e?`25px`:`50px`};
  height: 100%;
`,h=e.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`,g=e.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
`,_=e.span`
  min-width: 0;
  display: flex;
  align-items: center;
`,v=e.span`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  max-width: 100%;
  padding: 4px 10px;
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(125, 170, 255, 0.18), rgba(83, 214, 180, 0.1)),
    rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 8px 20px rgba(8, 12, 24, 0.18);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.82rem;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`,y=({value:e,options:t,placeholder:n=`Select`,onChange:r,label:i,asTableCell:a,triggerDisplay:o=`text`})=>{let[u,y]=(0,s.useState)(!1),b=(0,s.useRef)(null),x=(0,s.useRef)(null),[S,C]=(0,s.useState)({top:0,left:0,width:0,maxHeight:320}),w=(0,s.useMemo)(()=>t.find(t=>t.value===e),[t,e]),T=w?.label??n;(0,s.useEffect)(()=>{if(!u)return;let e=b.current;if(!e)return;let n=e.getBoundingClientRect(),r=Math.min(t.length*46,320),i=window.innerHeight-n.bottom-8,a=n.top-8,o=i<r&&a>i,s=Math.max(160,o?a:i);C({top:o?Math.max(8,n.top-8-Math.min(r,s)):n.bottom+8,left:n.left,width:n.width,maxHeight:s});let c=t=>{let n=t.target;e.contains(n)||x.current?.contains(n)||y(!1)};return window.addEventListener(`mousedown`,c),()=>window.removeEventListener(`mousedown`,c)},[u]);let E=e=>{r(e.value),y(!1)};return(0,l.jsxs)(h,{children:[i&&(0,l.jsx)(g,{children:i}),(0,l.jsxs)(m,{$asTableCell:a,ref:b,type:`button`,variant:`secondary`,onClick:()=>y(e=>!e),children:[(0,l.jsx)(_,{children:o===`chip`&&w?(0,l.jsx)(v,{children:T}):(0,l.jsx)(`span`,{children:T})}),(0,l.jsx)(`span`,{children:u?`🡡`:`🡣`})]}),u&&(0,c.createPortal)((0,l.jsx)(d,{children:(0,l.jsx)(f,{ref:x,top:S.top,left:S.left,width:S.width,maxHeight:S.maxHeight,children:t.map(t=>(0,l.jsx)(p,{type:`button`,selected:t.value===e,onClick:()=>E(t),children:t.label},t.value))})}),document.body)]})};export{y as t};