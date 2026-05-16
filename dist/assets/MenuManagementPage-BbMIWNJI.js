import{a as e,s as t,t as n,u as r}from"./jsx-runtime-D1CT_DlN.js";import{l as ee}from"./dataApi-BpCh87Z0.js";import{t as i}from"./Button-EnPxuzX1.js";import{t as a}from"./Input-nc9Mnbry.js";import{t as o}from"./Dropdown-BmAPxHM2.js";import{a as te,i as ne,n as s,o as re,r as c,s as l,t as u}from"./menuApi-C_NTfc23.js";var d=r(t(),1),f=n(),ie=e.main`
  display: grid;
  gap: 18px;
`,p=e.section`
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 12px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`,ae=e.h1`
  margin: 0;
  font-size: 1rem;
`,oe=e.section`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`,m=e.article`
  display: grid;
  gap: 12px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
`,h=e.h2`
  margin: 0;
  font-size: 1.1rem;
`,g=e.div`
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`,_=e.label`
  display: grid;
  gap: 8px;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.68);
`,v=e.textarea`
  width: 100%;
  min-height: 120px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  color: ${({theme:e})=>e.colors.text};
  background: rgba(255, 255, 255, 0.04);
  resize: vertical;
  outline: none;
`,y=e.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
`,b=e.div`
  display: grid;
  gap: 8px;
`,x=e.button`
  width: 100%;
  border: 1px solid ${({$active:e})=>e?`rgba(113, 159, 255, 0.65)`:`rgba(255, 255, 255, 0.08)`};
  border-radius: 12px;
  padding: 10px 12px;
  text-align: left;
  background: ${({$active:e})=>e?`rgba(113, 159, 255, 0.14)`:`rgba(255, 255, 255, 0.03)`};
  color: ${({theme:e})=>e.colors.text};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`,S=e.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`,C=e.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.62);
`,se=e.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`,ce=e.div`
display: flex;
gap: 8px;
    flex-direction: column;
;`,le=e=>e.map(e=>({value:e.id,label:e.name})),w=()=>{let{data:e}=ee(),t=e?.data??[],n=(0,d.useMemo)(()=>le(t),[t]),[r,w]=(0,d.useState)(``),ue=re(r||null),de=u(),fe=(ue.data??[]).map(e=>({value:e.id,label:e.name})),pe=(de.data??[]).map(e=>({value:e.id,label:e.name})),[T,E]=(0,d.useState)(``),D=c(r),O=l(r),k=ne(r),[A,j]=(0,d.useState)(``),M=te(A||null).data??[],N=s(A),[P,F]=(0,d.useState)(``),I=M.find(e=>e.id===P),[L,R]=(0,d.useState)(``),[z,B]=(0,d.useState)(``),[V,H]=(0,d.useState)(``),[U,W]=(0,d.useState)(`1`),[G,K]=(0,d.useState)(``),[q,J]=(0,d.useState)(``),[Y,X]=(0,d.useState)(`0`),[Z,Q]=(0,d.useState)(``),$=()=>{F(``),R(``),B(``),H(``),W(`1`),K(``),J(``),X(`0`),Q(``)},me=e=>{F(e.id),R(e.name),B(e.description??``),H(e.categoryId),W(String(e.quantity)),K(e.volumeValue==null?``:String(e.volumeValue)),J(e.volumeName??``),X(String(e.price)),Q(e.image??``)};return(0,f.jsxs)(ie,{children:[(0,f.jsx)(p,{children:(0,f.jsx)(ae,{children:`Մենյուի կառավարում`})}),(0,f.jsxs)(m,{as:`form`,onSubmit:async e=>{e.preventDefault(),!(!r||!T.trim())&&(await D.mutateAsync({name:T.trim()}),E(``))},children:[(0,f.jsx)(h,{children:`Menus`}),(0,f.jsxs)(g,{children:[(0,f.jsx)(o,{label:`Ընտրել ռեստորանը`,value:r,options:n,placeholder:`Ընտրել ռեստորանը`,onChange:w}),(0,f.jsxs)(ce,{children:[(0,f.jsx)(_,{children:`Նոր / Անվանափոխել`}),(0,f.jsx)(a,{value:T,onChange:e=>E(e.target.value),placeholder:`Նոր / Անվանափոխել`})]}),(0,f.jsx)(o,{label:`Ընտրել մենյուն`,value:A,options:fe,placeholder:`Ընտրել մենյուն`,onChange:j})]}),(0,f.jsxs)(y,{children:[(0,f.jsx)(i,{type:`submit`,disabled:!r||D.isPending,children:`Ստեղծել մենյու`}),(0,f.jsx)(i,{type:`button`,variant:`secondary`,onClick:async()=>{!A||!T.trim()||(await O.mutateAsync({menuId:A,payload:{name:T.trim()}}),E(``))},disabled:!A||O.isPending,children:`Անվանափոխել`}),(0,f.jsx)(i,{type:`button`,variant:`ghost`,onClick:async()=>{A&&(await k.mutateAsync(A),j(``),$())},disabled:!A||k.isPending,children:`Ջնջել`})]})]}),(0,f.jsxs)(oe,{children:[(0,f.jsxs)(m,{as:`form`,onSubmit:async e=>{e.preventDefault(),!(!A||!L.trim()||!V)&&(await N.mutateAsync({name:L.trim(),description:z.trim()||void 0,categoryId:V,quantity:Math.max(1,Number(U)||1),volumeValue:G?Number(G):void 0,volumeName:q.trim()||void 0,price:Math.max(0,Number(Y)||0),image:Z.trim()||void 0}),$())},children:[(0,f.jsx)(h,{children:`Խմբագրել ապրանքը`}),(0,f.jsxs)(g,{children:[(0,f.jsxs)(_,{children:[`Ապրանքի անունը`,(0,f.jsx)(a,{value:L,onChange:e=>R(e.target.value),placeholder:`Enter product name`})]}),(0,f.jsxs)(_,{children:[`Կատեգորիան`,(0,f.jsx)(o,{value:V,options:pe,placeholder:`Select category`,onChange:H})]})]}),(0,f.jsxs)(_,{children:[`Նկարագրություն`,(0,f.jsx)(v,{value:z,onChange:e=>B(e.target.value),placeholder:`Product description...`})]}),(0,f.jsx)(h,{children:`Գույքագրում և գնագոյացում`}),(0,f.jsx)(g,{children:(0,f.jsxs)(_,{children:[`Գին`,(0,f.jsx)(a,{type:`number`,min:0,step:`0.01`,value:Y,onChange:e=>X(e.target.value)})]})}),(0,f.jsxs)(g,{children:[(0,f.jsxs)(_,{children:[`Ծավալ (թիվ)`,(0,f.jsx)(a,{type:`number`,min:0,step:`0.01`,value:G,onChange:e=>K(e.target.value),placeholder:`0.5`})]}),(0,f.jsxs)(_,{children:[`Ծավալ (միավոր)`,(0,f.jsx)(a,{value:q,onChange:e=>J(e.target.value),placeholder:`լ / մլ / գ`})]})]}),(0,f.jsxs)(_,{children:[`Նկար URL`,(0,f.jsx)(a,{value:Z,onChange:e=>Q(e.target.value),placeholder:`https://...`})]}),(0,f.jsxs)(se,{children:[(0,f.jsx)(i,{type:`button`,variant:`secondary`,onClick:$,children:`Չեղարկել`}),(0,f.jsx)(i,{type:`submit`,disabled:!A||N.isPending,children:N.isPending?`Saving...`:`Save Product`})]})]}),(0,f.jsxs)(m,{children:[(0,f.jsx)(h,{children:`Ապրանքի նկարը`}),(0,f.jsx)(S,{children:Z?(0,f.jsx)(`img`,{src:Z,alt:L||`dish`}):null}),(0,f.jsx)(h,{children:`Առկա ապրանքները`}),A&&M.length===0&&(0,f.jsx)(C,{children:`Մենյուն դատարկ է`}),!A&&(0,f.jsx)(C,{children:`Ընտրել մենյուն ապրանք ավելացնելու համար`}),M.length>0&&(0,f.jsx)(b,{children:M.map(e=>(0,f.jsxs)(x,{type:`button`,$active:e.id===P,onClick:()=>me(e),children:[(0,f.jsx)(`span`,{children:e.name}),(0,f.jsx)(`span`,{children:e.quantity})]},e.id))}),I&&(0,f.jsxs)(C,{children:[`Ընտրված: `,I.name,` (article #`,I.article,`)`]})]})]})]})};export{w as default};