import{a as e,s as t,t as n,u as r}from"./jsx-runtime-D1CT_DlN.js";var i=r(t(),1),a=n(),o=e.button`
  border: none;
  border-radius: 14px;
  min-height: 44px;
  padding: 0 18px;
  color: ${({variant:e,theme:t})=>e===`secondary`?t.colors.text:`#fff`};
  background: ${({variant:e})=>e===`secondary`?`rgba(255,255,255,0.06)`:`linear-gradient(135deg, #5d7bff, #34d399)`};
  font-weight: 700;
  transition: transform 120ms ease, opacity 120ms ease;
  box-shadow: 0 8px 35px rgba(16, 24, 64, 0.18);
  backdrop-filter: blur(18px);
  &:hover {
    transform: translateY(-1px);
    opacity: 0.95;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`,s=(0,i.forwardRef)(({children:e,...t},n)=>(0,a.jsx)(o,{ref:n,...t,children:e}));export{s as t};