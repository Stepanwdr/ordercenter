import{a as e,s as t,t as n,u as r}from"./jsx-runtime-D1CT_DlN.js";import{c as i}from"./chunk-OE4NN4TA-Dp4l5uPd.js";import{r as a}from"./base-RRG-_shF.js";import{l as o,n as s,o as c,r as l,u}from"./dataApi-BpCh87Z0.js";import{t as d}from"./Button-EnPxuzX1.js";import{t as f}from"./Input-nc9Mnbry.js";import{t as p}from"./Dropdown-BmAPxHM2.js";import{t as m}from"./Drawer-BXRNcf6w.js";import{n as h,t as g}from"./SelectCourierStatus-B-OJsw8v.js";var _=r(t(),1),v=e.div`
  width: 100%;
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px);
  box-shadow: 0 20px 80px rgba(4, 9, 22, 0.2);
`,y=n(),b={name:``,phone:``,status:`free`,currentOrder:``,email:``,restaurantId:``},x=()=>{let{data:e}=s(),t=l(L),n=u(L),r=c(),[x,k]=(0,_.useState)(null),[A,j]=(0,_.useState)(!1),[M,N]=(0,_.useState)({...b,restaurantId:``}),{data:P}=o(),F=i(),I=()=>{N(b),j(!0)};function L(){j(!1),N(b),k(null)}let R=e=>{e.preventDefault(),!(!M.name.trim()||!M.phone.trim())&&(x?n.mutateAsync({id:x.userId,payload:{name:M.name,phone:M.phone,status:M.status,currentOrder:M.currentOrder,restaurantId:M.restaurantId,email:M.email}}):t.mutateAsync({payload:{email:M.email||``,name:M.name,phone:M.phone,status:M.status,currentOrder:M.currentOrder,restaurantId:M.restaurantId}}))},z=async e=>{window.confirm(`Ջնջել առաքիչին`)&&(await r.mutateAsync(e),a.success(`Առաքիչը ջնջվեց համակարգից`))},B=e=>{k(e)},V=e?.data||[],H=P?.data?.map(e=>({value:e.id,label:e.name}))||[];return(0,_.useEffect)(()=>{x&&N({...b,restaurantId:x.restaurant?.id||``,email:x?.user?.email||``,phone:x?.user?.phone||``,status:x.status||`free`,currentOrder:``,name:x?.user?.name||``})},[x]),(0,y.jsxs)(`div`,{children:[(0,y.jsxs)(S,{children:[(0,y.jsx)(C,{children:`Առաքիչներ`}),(0,y.jsxs)(`div`,{style:{display:`flex`,gap:`12px`,flexWrap:`wrap`},children:[(0,y.jsx)(d,{variant:`secondary`,children:`Թարմացնել ցուցակը`}),(0,y.jsx)(d,{variant:`primary`,onClick:I,children:`Ավելացնել առաքիչ`})]})]}),(0,y.jsx)(v,{children:(0,y.jsxs)(w,{children:[(0,y.jsx)(`thead`,{children:(0,y.jsxs)(`tr`,{children:[(0,y.jsx)(T,{children:`Անուն`}),(0,y.jsx)(T,{children:`Հեռախոս`}),(0,y.jsx)(T,{children:`Էլ հասցե`}),(0,y.jsx)(T,{children:`Կարգավիճակ`}),(0,y.jsx)(T,{children:`Ռեստորան`}),(0,y.jsx)(T,{})]})}),(0,y.jsx)(`tbody`,{children:V.map(e=>{let t=e.userId,n=e?.user?.name||``,r=e?.user?.phone||``,i=e?.user?.email||``,a=e?.restaurant?.name||``;return(0,y.jsxs)(`tr`,{children:[(0,y.jsx)(E,{children:n}),(0,y.jsx)(E,{children:r}),(0,y.jsx)(E,{children:i}),(0,y.jsx)(E,{children:(0,y.jsx)(D,{status:e.status,children:h[e.status]})}),(0,y.jsx)(E,{children:a}),(0,y.jsxs)(E,{children:[(0,y.jsx)(d,{variant:`ghost`,onClick:()=>F(`/couriers/${t}`),children:`Դիտել`}),(0,y.jsx)(d,{variant:`secondary`,onClick:()=>B(e),style:{marginLeft:`10px`},children:`Խմբագրել`}),(0,y.jsx)(d,{variant:`secondary`,onClick:()=>z(t),style:{marginLeft:`10px`},children:`Ջնջել`})]})]},t)})})]})}),(0,y.jsx)(m,{open:A||!!x,title:x?`Խմբագրել`:`Ավելացնել առաքիչ`,onClose:L,position:`bottom`,children:(0,y.jsxs)(`form`,{onSubmit:R,children:[(0,y.jsxs)(O,{children:[`Անուն`,(0,y.jsx)(f,{value:M.name,onChange:e=>N({...M,name:e.target.value}),placeholder:`Առաքիչի անուն`})]}),(0,y.jsxs)(O,{children:[`Ռեստորանը`,(0,y.jsx)(p,{value:M.restaurantId,options:H,placeholder:`Ընտրել ռեստորանը`,onChange:e=>N({...M,restaurantId:e}),triggerDisplay:`chip`})]}),(0,y.jsxs)(O,{children:[`Հեռախոս`,(0,y.jsx)(f,{value:M.phone,onChange:e=>N({...M,phone:e.target.value}),placeholder:`+1 415 123 4567`})]}),(0,y.jsxs)(O,{children:[`Էլ հասցե`,(0,y.jsx)(f,{value:M.email,onChange:e=>N({...M,email:e.target.value}),placeholder:`youremail@gmail.com`})]}),(0,y.jsxs)(O,{children:[`Կարգավիճակ`,(0,y.jsx)(p,{value:M.status,options:g,placeholder:`Առաքիչի կարգավիճակը`,onChange:e=>N({...M,status:e}),triggerDisplay:`chip`})]}),x&&(0,y.jsxs)(O,{children:[`Ընթացիկ պատվեր`,(0,y.jsx)(f,{value:M.currentOrder,onChange:e=>N({...M,currentOrder:e.target.value}),placeholder:`ORD-1234`})]}),(0,y.jsxs)(`div`,{style:{display:`flex`,gap:`12px`,flexWrap:`wrap`},children:[(0,y.jsx)(d,{type:`submit`,children:x?`Պահպանել`:`Ստեղծել առաքիչ`}),(0,y.jsx)(d,{type:`button`,variant:`secondary`,onClick:L,children:`Չեղարկել`})]})]})})]})},S=e.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`,C=e.h1`
  margin: 0;
`,w=e.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 720px;
`,T=e.th`
  padding: 18px 16px;
  text-align: left;
  color: rgba(255, 255, 255, 0.74);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`,E=e.td`
  padding: 18px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
`,D=e.span`
  display: inline-flex;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  background: ${({status:e})=>e===`delivering`?`#9d7cff`:e===`offline`?`rgba(255, 255, 255, 0.08)`:`#34d399`};
  color: #fff;
`,O=e.label`
  display: grid;
  gap: 10px;
  color: ${({theme:e})=>e.colors.text};
  font-weight: 600;
  margin-bottom: 18px;
`;export{x as default};