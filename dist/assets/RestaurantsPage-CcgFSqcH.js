import{a as e,s as t,t as n,u as r}from"./jsx-runtime-D1CT_DlN.js";import"./base-RRG-_shF.js";import{a as i,d as a,l as o,s}from"./dataApi-BpCh87Z0.js";import{t as c}from"./Button-EnPxuzX1.js";import{t as l}from"./Input-nc9Mnbry.js";import{t as u}from"./Drawer-BXRNcf6w.js";var d=r(t(),1),f=n();e.div` display: flex; flex-direction: column; gap: 8px; `,e.div` width: 120px; height: 120px; border-radius: 8px; overflow: hidden; background: #111; display: flex; align-items: center; justify-content: center; `,e.img` width: 100%; height: 100%; object-fit: cover; `,e.button` padding: 8px 12px; border-radius: 6px; border: 1px solid #444; background: #1f2937; color: white; cursor: pointer; `,e.input` display: none; `;var p=e.main`
  padding: 32px;
  box-sizing: border-box;
  width: 100%;
`,m=e.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
`,h=e.h1`
  margin: 0;
`,g=e.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`,_=e.article`
  display: grid;
  gap: 16px;
  padding: 24px;
  border-radius: 24px;
  background: rgba(18, 24, 44, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 22px 48px rgba(0, 0, 0, 0.18);
`,v=e.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
    flex-direction: column;
`,y=e.h2`
  margin: 0;
  font-size: 1.2rem;
`,b=e.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.66);
  line-height: 1.6;
`;e.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  color: #fff;
  background: ${({status:e})=>e===`open`?`#34d399`:e===`busy`?`#f59e0b`:`rgba(255, 255, 255, 0.12)`};
`;var x=e.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`,S=e.div`
  display: grid;
  gap: 10px;
`,C=e.div`
  display: grid;
  gap: 8px;
`,w=e.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
`,T=e.label`
  display: grid;
  gap: 10px;
  color: ${({theme:e})=>e.colors.text};
  font-weight: 600;
`,E=e.div`
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr auto;
  align-items: center;
  margin-bottom:10px ;
    
`,D=e.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.7;
`,O=e.div`
    display: flex;
    flex-direction: column;
    max-width: 800px;
    margin: 0 auto;
    gap: 20px;
`,k=e.div`
   min-width: 150px;
   min-height: 150px;
   overflow: hidden;
   border-radius: 24px;
   img {
   width: 100%;
   height: 100%;
   object-fit: cover;
}
`,A=e.div`
 display: flex;
 gap: 1rem;
 margin-bottom: 10px;
 `,j={id:``,name:``,cuisine:``,addresses:[{address:``}],phone:``,status:`open`},M=[{label:`Հիմնական տվյալներ`,value:`details`}],N=()=>{let[e,t]=(0,d.useState)(``),[n,r]=(0,d.useState)(`0`),[N,ee]=(0,d.useState)(`0`),[P,te]=(0,d.useState)(``),[F,ne]=(0,d.useState)(``),[re,ie]=(0,d.useState)(``),[ae,oe]=(0,d.useState)(``),[se,ce]=(0,d.useState)(``),[le,ue]=(0,d.useState)(``),[de,fe]=(0,d.useState)(null),[I,L]=(0,d.useState)(M[0].value),{data:R}=o(),[z,B]=(0,d.useState)(null),[V,H]=(0,d.useState)(j),[U,W]=(0,d.useState)(!1),G=i(),K=a(),q=s(),J=z?`Edit`:`Create`,Y=e=>{if(e){B(e);let t=e.addresses?.length?e.addresses.map(e=>({address:[e.address].filter(Boolean).join(`, `)})):[{address:``}];H({id:e.id,name:e.name,cuisine:e.cuisine,addresses:t,phone:e.phone,status:e.status})}else B(null),H(j);W(!0)},X=()=>{W(!1),B(null),H(j)},Z=e=>{e.preventDefault();let t=V.addresses.some(e=>e.address.trim().length>0);if(!V.name.trim()||!t)return;let r=new FormData;r.append(`name`,V.name),r.append(`lat`,n),r.append(`lng`,N),r.append(`phone`,V.phone),P&&r.append(`photo`,P),r.append(`cuisine`,F);let i=V.addresses;i.length&&r.append(`addresses`,JSON.stringify(i)),z?K.mutateAsync({id:z.id,payload:r}):G.mutateAsync(r),X()},Q=e=>{window.confirm(`Удалить ресторан?`)&&q.mutate(e)},$=R?.data||[];return(0,f.jsxs)(p,{children:[(0,f.jsxs)(m,{children:[(0,f.jsxs)(`div`,{children:[(0,f.jsx)(h,{children:`Ռեստորաններ`}),(0,f.jsxs)(D,{children:[$.length,` ռեստորան`]})]}),(0,f.jsx)(c,{variant:`primary`,onClick:()=>Y(),children:`Ավելացնել ռեստորան`})]}),(0,f.jsx)(g,{children:$.map(e=>(0,f.jsxs)(_,{children:[(0,f.jsxs)(v,{children:[(0,f.jsx)(k,{children:(0,f.jsx)(`img`,{src:`https://assets.cntraveller.in/photos/6916c7e2b3040f358c22b7ed/master/w_1600%2Cc_limit/DSC01647.JPG`,alt:``})}),(0,f.jsxs)(`div`,{children:[(0,f.jsx)(y,{children:e.name}),(0,f.jsx)(b,{children:e.cuisine})]})]}),(0,f.jsxs)(S,{children:[(0,f.jsx)(C,{children:e.addresses?.map((t,n)=>(0,f.jsx)(w,{children:typeof t==`string`?t:[t.address].filter(Boolean).join(`, `)},`${e.id}-address-${n}`))}),(0,f.jsxs)(b,{children:[`Phone: `,e.phone]})]}),(0,f.jsxs)(x,{children:[(0,f.jsx)(c,{variant:`secondary`,onClick:()=>Y(e),children:`Խմբագրել`}),(0,f.jsx)(c,{variant:`secondary`,onClick:()=>Q(e.id),children:`Ջնջել`})]})]},e.id))}),(0,f.jsx)(u,{open:U,title:`${J===`Create`?`Ստեղծել`:`Խմբագրել`} ռեստորանը`,onClose:X,position:`bottom`,children:(0,f.jsxs)(`form`,{onSubmit:Z,children:[(0,f.jsx)(O,{children:(0,f.jsx)(A,{children:M.map(e=>(0,f.jsx)(c,{type:`button`,variant:e.value===I?`ghost`:`secondary`,onClick:()=>L(e.value),children:e.label}))})}),I===`details`&&(0,f.jsxs)(O,{children:[(0,f.jsxs)(T,{children:[`Անուն`,(0,f.jsx)(l,{value:V.name,onChange:e=>H({...V,name:e.target.value}),placeholder:`Ռեստորանի անուն`})]}),(0,f.jsxs)(T,{children:[`Հեռախոսահամար`,(0,f.jsx)(l,{value:V.phone,onChange:e=>H({...V,phone:e.target.value}),placeholder:`+374 98 888 888`})]}),(0,f.jsxs)(T,{children:[`Հասցեներ`,(0,f.jsx)(`div`,{children:V.addresses.map((e,t)=>(0,f.jsxs)(E,{children:[(0,f.jsx)(l,{value:e.address,onChange:e=>{let n=[...V.addresses];n[t].address=e.target.value,H({...V,addresses:n})},placeholder:`Քաղաք,թաղամաս,շենք`}),(0,f.jsx)(c,{variant:`ghost`,type:`button`,onClick:()=>{H(e=>{let n=e.addresses.filter((e,n)=>n!==t);return{...e,addresses:n}})},children:`Remove`})]},`address-${t}`))}),(0,f.jsx)(c,{variant:`secondary`,type:`button`,onClick:()=>H(e=>({...e,addresses:[...e.addresses,{address:``}]})),children:`Ավելացնել այլ հասցեում`})]}),(0,f.jsxs)(x,{children:[(0,f.jsx)(c,{type:`submit`,children:`Պահել`}),(0,f.jsx)(c,{variant:`secondary`,type:`button`,onClick:X,children:`Չեղարկել`})]})]})]})})]})};export{N as default};