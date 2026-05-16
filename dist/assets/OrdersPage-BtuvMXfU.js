import{a as e,s as t,t as n,u as r}from"./jsx-runtime-D1CT_DlN.js";import"./ordersStore-DSK02ksq.js";import{c as i,i as a,l as o,n as s}from"./dataApi-BpCh87Z0.js";import{t as c}from"./Button-EnPxuzX1.js";import{t as l}from"./Input-nc9Mnbry.js";import{t as u}from"./Dropdown-BmAPxHM2.js";import{t as d}from"./Drawer-BXRNcf6w.js";import{t as f}from"./SelectCourierStatus-B-OJsw8v.js";import{t as p}from"./Table-DKj_b1NW.js";import{a as m,o as ee,t as h}from"./menuApi-C_NTfc23.js";var g=r(t(),1),_=n(),v=({setFormData:e,formData:t})=>(0,_.jsxs)(S,{children:[(0,_.jsx)(C,{children:`Պատվիրատույի տվյալներ`}),(0,_.jsxs)(w,{children:[(0,_.jsx)(l,{value:t.customerName,onChange:t=>e(`customerName`,t.target.value),placeholder:`Պատվիրատուի անունը`}),(0,_.jsx)(l,{value:t.customerPhone,onChange:t=>e(`customerPhone`,t.target.value),placeholder:`+374 00 000000`})]}),t.orderType===`delivery`&&(0,_.jsxs)(_.Fragment,{children:[(0,_.jsxs)(w,{children:[(0,_.jsxs)(b,{children:[(0,_.jsx)(x,{children:`Քաղաք`}),(0,_.jsx)(l,{value:t.city,onChange:t=>e(`city`,t.target.value),placeholder:`Քաղաք`})]}),(0,_.jsxs)(b,{children:[(0,_.jsx)(x,{children:`Թաղ`}),(0,_.jsx)(l,{value:t.street,onChange:t=>e(`street`,t.target.value),placeholder:`Թաղ`})]})]}),(0,_.jsxs)(w,{children:[(0,_.jsxs)(b,{children:[(0,_.jsx)(x,{children:`Շենք`}),(0,_.jsx)(l,{value:t.building,onChange:t=>e(`building`,t.target.value),placeholder:`Շենք`})]}),(0,_.jsxs)(b,{children:[(0,_.jsx)(x,{children:`Մուտք`}),(0,_.jsx)(l,{value:t.entrance,onChange:t=>e(`entrance`,t.target.value),placeholder:`Մուտք`})]}),(0,_.jsxs)(b,{children:[(0,_.jsx)(x,{children:`Հարկ`}),(0,_.jsx)(l,{value:t.floor,onChange:t=>e(`floor`,t.target.value),placeholder:`Հարկ`})]}),(0,_.jsxs)(b,{children:[(0,_.jsx)(x,{children:`Բնակարան/տուն/գրասենյակ`}),(0,_.jsx)(l,{value:t.apartment,onChange:t=>e(`apartment`,t.target.value),placeholder:`Բնակարան/տուն/գրասենյակ`})]}),(0,_.jsxs)(b,{children:[(0,_.jsx)(x,{children:`Դոմոֆոն`}),(0,_.jsx)(l,{value:t.domofon,onChange:t=>e(`domofon`,t.target.value),placeholder:`Դոմոֆոն`})]}),(0,_.jsxs)(b,{children:[(0,_.jsx)(x,{children:`Մեկնաբանություն`}),(0,_.jsx)(l,{value:t.addressComment,onChange:t=>e(`addressComment`,t.target.value),placeholder:`Մեկնաբանություն`})]})]})]})]}),y=e.section`
    display: grid;
    gap: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 14px;
`,b=e.div`
display: flex;
gap: 8px;
    flex-direction: column;
;`,x=e.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`,S=e(y)`
    grid-column: 1 / -1;
`,C=e.h2`
  margin: 0;
  font-size: 1.1rem;
`,w=e.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`,T=e=>`${e.toFixed(2)}դր`,E=({onClose:e})=>{let{data:t}=o(),n=t?.data??[],r=h().data??[],[i,d]=(0,g.useState)({customerPhone:``,deliveryAddress:``,entrance:``,domofon:``,addressComment:``,customerName:``,orderType:`delivery`,city:``,street:``,building:``,apartment:``,floor:``}),[f,p]=(0,g.useState)(``),[y,b]=(0,g.useState)(``),x=ee(f||null).data??[],[S,C]=(0,g.useState)(``),[w,E]=(0,g.useState)(``),F=m(S||null,w).data??[],[I,L]=(0,g.useState)(``),[R,z]=(0,g.useState)(`all`),[B,V]=(0,g.useState)([]),[H,U]=(0,g.useState)(``),W=n.map(e=>({value:e.id,label:e.name})),G=x.map(e=>({value:e.id,label:e.name})),{data:K}=s(),q=(K?.data??[]).filter(e=>!f||e.restaurant?.id===f||e.restaurantId===f).map(e=>({value:e.userId??e.id,label:e.user?.name??e.user?.email??e.name??`Courier`})),J=(0,g.useMemo)(()=>F.filter(e=>R===`all`||e.categoryId===R),[F,R]),Y=a(),X=e=>{V(t=>t.find(t=>t.id===e.id)?t.map(t=>t.id===e.id?{...t,count:t.count+1}:t):[...t,{...e,count:1}])},Z=(e,t)=>{V(n=>n.map(n=>n.id===e?{...n,count:Math.max(0,n.count+t)}:n).filter(e=>e.count>0))},Q=B.reduce((e,t)=>e+Number(t.price)*t.count,0),$=Q+Q*.08;return(0,g.useEffect)(()=>{let e=window.setTimeout(()=>{E(I.trim())},350);return()=>window.clearTimeout(e)},[I]),(0,_.jsxs)(ne,{children:[(0,_.jsxs)(me,{children:[(0,_.jsxs)(he,{children:[(0,_.jsx)(u,{label:`Ռետտորան`,value:f,options:W,placeholder:`Ընտրել ռեստորան`,onChange:e=>{p(e)}}),(0,_.jsx)(u,{label:`Մենյու`,value:S,options:G,placeholder:`Ընտրել մենյու`,onChange:C}),(0,_.jsx)(u,{label:`Առաքիչ`,value:y,options:q,placeholder:`Ընտրել առաքիչ`,onChange:b})]}),(0,_.jsxs)(ge,{children:[(0,_.jsx)(l,{value:I,onChange:e=>L(e.target.value),placeholder:`Որոնել ապրանք...`}),(0,_.jsxs)(se,{children:[(0,_.jsx)(M,{type:`button`,$active:R===`all`,onClick:()=>z(`all`),children:`Բոլորը`}),r.map(e=>(0,_.jsx)(M,{type:`button`,$active:R===e.id,onClick:()=>z(e.id),children:e.name},e.id))]})]}),(0,_.jsx)(ie,{children:(0,_.jsx)(O,{children:(0,_.jsx)(ae,{style:{overflow:`auto`,maxHeight:`600px`},children:J.map(e=>(0,_.jsxs)(oe,{children:[(0,_.jsx)(k,{children:e.image?(0,_.jsx)(`img`,{src:e.image,alt:e.name}):null}),(0,_.jsx)(A,{children:e.name}),(0,_.jsx)(j,{children:e.description??`No description`}),(0,_.jsxs)(P,{children:[(0,_.jsx)(`span`,{children:e.category?.name??`Category`}),(0,_.jsx)(`strong`,{children:T(Number(e.price))})]}),(0,_.jsx)(c,{type:`button`,variant:`secondary`,onClick:()=>X(e),children:`Ավելացնել`})]},e.id))})})}),B.length>0&&(0,_.jsx)(v,{setFormData:(e,t)=>d(n=>({...n,[e]:t})),formData:i}),B.length>0&&(0,_.jsxs)(D,{children:[(0,_.jsx)(te,{children:`Տրման ժամը`}),(0,_.jsx)(l,{type:`time`,value:H,onChange:e=>U(e.target.value),placeholder:`Տրման ժամը`})]})]}),(0,_.jsxs)(pe,{children:[(0,_.jsx)(re,{style:{fontSize:`1.4rem`},children:`Պատվեր`}),(0,_.jsxs)(ce,{children:[B.map(e=>(0,_.jsxs)(le,{children:[(0,_.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`5px`},children:[(0,_.jsx)(k,{style:{width:`60px`,margin:`10px 0`},children:e.image?(0,_.jsx)(`img`,{src:e.image,alt:e.name}):null}),(0,_.jsx)(A,{children:e.name}),(0,_.jsx)(j,{children:T(Number(e.price))})]}),(0,_.jsxs)(ue,{children:[(0,_.jsx)(N,{type:`button`,onClick:()=>Z(e.id,-1),children:`-`}),(0,_.jsx)(`span`,{children:e.count}),(0,_.jsx)(N,{type:`button`,onClick:()=>Z(e.id,1),children:`+`})]})]},e.id)),B.length===0&&(0,_.jsx)(j,{children:`Ընտրել ապրանք պատվիրելու համար.`})]}),(0,_.jsxs)(de,{children:[(0,_.jsxs)(P,{children:[(0,_.jsx)(`span`,{children:`Տրման ժամը`}),(0,_.jsx)(`span`,{children:H||`Անիմջապես`})]}),(0,_.jsxs)(P,{children:[(0,_.jsx)(`strong`,{children:`Գումարը`}),(0,_.jsx)(`strong`,{children:T($)})]})]}),(0,_.jsxs)(fe,{children:[(0,_.jsx)(c,{type:`button`,variant:`secondary`,children:`Պահպանել`}),(0,_.jsx)(c,{type:`button`,variant:`ghost`,onClick:async()=>{if(!f){alert(`Ընտրեք ռեստորան`);return}if(B.length===0){alert(`Ընտրեք առնվազն մեկ ապրանք`);return}let t=B.map(e=>({menuItemId:e.id,quantity:e.count,price:e.price})),n=`${i.city||``}, ${i.street||``}, ${i.building||``},`,r={price:$,restaurantId:f,...i,prepTime:H,deliveryAddress:n,orderItems:t};y&&(r.courierId=y),await Y.mutateAsync(r),e()},children:`Ուղարկել խոհանոց`})]})]})]})},D=e.div`
display: flex;
gap: 8px;
    flex-direction: column;
;`,te=e.label`
  display: grid;
  gap: 8px;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.68);
`,ne=e.main`
    display: grid;
    gap: 14px;
    overflow: auto;
    max-height: 90vh;
    width: 100%;
    grid-template-columns: 3fr 1fr;
`;e.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
`;var re=e.h1`
    margin: 0;
    font-size: 1.7rem;
`,ie=e.section`
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    @media (max-width: 1100px) {
        grid-template-columns: 1fr;
    }
`,O=e.section`
    display: grid;
    gap: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 14px;
`,ae=e.div`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;

    @media (max-width: 1200px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 760px) {
        grid-template-columns: 1fr;
    }
`,oe=e.article`
    display: grid;
    gap: 8px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    padding: 10px;
`,k=e.div`
    width: 100%;
    aspect-ratio: 16/10;
    border-radius: 10px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.02);

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`,A=e.h3`
    margin: 0;
    font-size: 1rem;
`,j=e.p`
    margin: 0;
    color: rgba(255, 255, 255, 0.62);
    font-size: 0.9rem;
`,se=e.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
`,M=e.button`
    border: 1px solid ${({$active:e})=>e?`rgba(141,180,255,0.7)`:`rgba(255,255,255,0.1)`};
    color: ${({$active:e})=>e?`#d9e8ff`:`rgba(255,255,255,0.72)`};
    background: ${({$active:e})=>e?`rgba(102,146,255,0.2)`:`rgba(255,255,255,0.04)`};
    border-radius: 999px;
    padding: 8px 14px;
    cursor: pointer;
    font-weight: 600;
`,ce=e.div`
    display: grid;
    gap: 10px;
`,le=e.div`
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 10px;
`,ue=e.div`
    display: inline-flex;
    align-items: center;
    gap: 8px;
`,N=e.button`
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    border-radius: 8px;
    width: 24px;
    height: 24px;
    cursor: pointer;
`,de=e.div`
    display: grid;
    gap: 8px;
    margin-top: 8px;
`,P=e.div`
    display: flex;
    justify-content: space-between;
    color: rgba(255, 255, 255, 0.82);
`,fe=e.div`
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-height: 80px;
    margin-top: auto;
    margin-bottom: 24px;
`,pe=e(O)`
min-height: 80vh;   
   display: flex;
    flex-direction: column;
    position: sticky;
    right: 24px;
`,me=e(O)`
    margin-right: 24px;

`,he=e(O)`
    grid-template-columns: 1fr 1fr;
`,ge=e(O)`
display: flex;
flex-direction: column;
`,F=e.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-top: 18px;
`,I=e(c)`
  min-width: 42px;
  padding: 10px 14px;
  border-radius: 14px;
  background: ${({active:e})=>e?`rgba(79, 143, 255, 0.95)`:`rgba(255, 255, 255, 0.04)`};
  color: ${({active:e})=>e?`#fff`:`rgba(255, 255, 255, 0.85)`};
  border: 1px solid rgba(255, 255, 255, 0.08);
  &:hover {
    background: ${({active:e})=>e?`rgba(79, 143, 255, 0.95)`:`rgba(255, 255, 255, 0.08)`};
  }
`,L=e.div`
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.92rem;
`,R=({currentPage:e,totalPages:t,onChange:n})=>{let r=[],i=Math.max(1,e-2),a=Math.min(t,e+2);for(let e=i;e<=a;e+=1)r.push(e);return(0,_.jsxs)(F,{children:[(0,_.jsxs)(L,{children:[`Page `,e,` of `,t]}),(0,_.jsx)(I,{type:`button`,variant:`secondary`,onClick:()=>n(Math.max(1,e-1)),disabled:e===1,children:`Prev`}),r.map(t=>(0,_.jsx)(I,{type:`button`,variant:`secondary`,active:t===e,onClick:()=>n(t),children:t},t)),(0,_.jsx)(I,{type:`button`,variant:`secondary`,onClick:()=>n(Math.min(t,e+1)),disabled:e===t,children:`Next`})]})},z=e=>e.replace(`T`,` `).replace(`.000Z`,``),B=e.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
`,V=e.h3`
    margin: 0;
`,H=e.div`
    display: grid;
    gap: 18px;
    margin-bottom: 20px;
`,U=e.div`
    display: grid;
    grid-template-columns: minmax(320px, 1fr) minmax(240px, 320px);
    gap: 16px;
    align-items: center;
`,W=e.div`
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
`,G=e.button`
    border: none;
    border-radius: 999px;
    padding: 10px 18px;
    background: ${({active:e})=>e?`rgba(79, 143, 255, 0.95)`:`rgba(255, 255, 255, 0.06)`};
    color: ${({active:e})=>e?`#fff`:`rgba(255, 255, 255, 0.78)`};
    font-weight: 700;
    cursor: pointer;
    transition: background 150ms ease;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }
`,K=e.div`
    display: flex;
    gap: 14px;
    align-items: center;
    flex-wrap: wrap;
`,q=e.section`
    margin-top: 20px;
    min-width: 0;
    overflow-x: auto;
    padding-bottom: 8px;
    .orders-table {
      .data-grid{
         height: calc(100vh - 423px)
        }
    }
  
`,J=e.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 0;
`,Y=e.span`
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(79, 143, 255, 0.12);
    border: 1px solid rgba(79, 143, 255, 0.24);
    color: rgba(255, 255, 255, 0.92);
    font-size: 0.85rem;
    line-height: 1.2;
    white-space: nowrap;
`,X=[`all`,`new`,`cooking`,`ready`,`delivering`,`done`],Z={all:`Բոլորը`,new:`Նոր`,cooking:`Պատրաստվում է`,ready:`Պատրաստ`,delivering:`Ճանապարհին է`,done:`Ավարտված`},Q=[`CASH`,`ONLINE`,`BANK POS`,`IDRAM`].map(e=>({value:e,label:e})),$=[{value:`cooking`,label:`Պատրաստվում է`},{value:`ready`,label:`Պատրաստ է`},{value:`enRoute`,label:`Ճանապարհին է`},{value:`done`,label:`Ավարտված`}],_e=()=>{let{data:e}=i(),[t,n]=(0,g.useState)(!1),[r,a]=(0,g.useState)(``),[o,s]=(0,g.useState)(`all`),[m,ee]=(0,g.useState)(`all`),[h,v]=(0,g.useState)(1),y=e&&e?.length?e:[],b=(0,g.useCallback)((e,t)=>{},[]),x=(0,g.useCallback)((e,t)=>{},[]),S=(0,g.useCallback)((e,t)=>{},[]),C=(0,g.useMemo)(()=>[{key:`code`,name:`Կոդ`,resizable:!0,draggable:!0},{key:`customerName`,name:`Հաճախորդ`,resizable:!0,draggable:!0},{key:`customerPhone`,name:`Հաճախորդի հեռ․`,resizable:!0,draggable:!0},{key:`orderTime`,name:`Գրանցման ամսաթիվը`,resizable:!0,draggable:!0,renderCell:({row:e})=>z(e.createdAt)},{key:`prepTime`,name:`Տրման Ժամը`,resizable:!0,draggable:!0,renderCell:({row:e})=>e?.prepTime||`Անմիջապես`},{key:`restaurant`,name:`Ռեստորան`,resizable:!0,draggable:!0,renderCell:({row:e})=>e?.restaurant?.name},{key:`courier`,name:`Առաքիչ`,resizable:!0,draggable:!0,renderCell:({row:e})=>e?.courierProfile?.user?.name},{key:`orderItems`,name:`Պատվեր`,resizable:!0,draggable:!0,renderCell:({row:e})=>{let t=e.orderItems;return(0,_.jsx)(J,{children:t.map(e=>(0,_.jsxs)(Y,{children:[e?.quantity,`h - `,e?.menuItem.name]},e?.id))})}},{key:`payMethod`,name:`Վճարման եղանակը`,resizable:!0,draggable:!0,width:180,renderCell:({row:e})=>(0,_.jsx)(u,{value:e.payMethod,options:Q,placeholder:`Վճարման եղանակը`,onChange:t=>b(e.id,t),asTableCell:!0,triggerDisplay:`chip`})},{key:`courierPhone`,name:`Առաքիչի հեռ․`,resizable:!0,draggable:!0,renderCell:({row:e})=>e?.courierProfile?.user?.phone},{key:`orderAddress`,name:`Պատվերի հասցե`,resizable:!0,draggable:!0,renderCell:({row:e})=>`${e.deliveryAddress}  ${e.addressComment||``}`},{key:`courierStatus`,name:`Առաքիչի կարգավիճակը`,resizable:!0,draggable:!0,renderCell:({row:e})=>(0,_.jsx)(u,{value:e?.courierProfile?.status,options:f,placeholder:`Առաքիչի կարգավիճակը`,onChange:t=>x(e.id,t),asTableCell:!0,triggerDisplay:`chip`})},{key:`operatorName`,name:`Օպերատոր`,resizable:!0,draggable:!0,renderCell:({row:e})=>e.operator.name},{key:`status`,name:`Պատվերի կարգավիճակ`,resizable:!0,draggable:!0,renderCell:({row:e})=>(0,_.jsx)(u,{value:e?.status||`new`,options:$,placeholder:`Պատվերի կարգավիճակը`,onChange:t=>S(e.id,t),asTableCell:!0,triggerDisplay:`chip`})},{key:`price`,name:`Գումարը`,resizable:!0,draggable:!0}],[x,S,b]),w=(0,g.useMemo)(()=>y.filter(e=>{let t=r.toLowerCase().trim(),n=t===``||[e.orderCode,e.customerName,e.restaurant,e.courierProfile].join(` `).toLowerCase().includes(t),i=o===`all`||e?.status===o,a=m===`all`||e.courierProfile.id===m;return n&&i&&a}),[y,r,o,m]);(0,g.useEffect)(()=>{v(1)},[r,o,m]);let T=Math.max(1,Math.ceil(w.length/10)),D=(0,g.useMemo)(()=>{let e=(h-1)*10;return w.slice(e,e+10)},[h,w]);return console.log({orders:y}),(0,_.jsxs)(`div`,{children:[(0,_.jsxs)(B,{children:[(0,_.jsx)(`div`,{children:(0,_.jsx)(V,{children:`Պատվերներ`})}),(0,_.jsx)(c,{onClick:()=>n(!0),variant:`primary`,children:`Ստեղծել պատվեր`})]}),(0,_.jsxs)(H,{children:[(0,_.jsx)(U,{children:(0,_.jsx)(l,{value:r,onChange:e=>a(e.target.value),placeholder:`Որոնում։ Ռեստորան կամ առաքիչ`})}),(0,_.jsx)(K,{children:(0,_.jsxs)(`span`,{style:{color:`rgba(255,255,255,0.72)`},children:[` գտնվել է `,w.length,` պատվեր  `]})})]}),(0,_.jsx)(W,{children:X.map(e=>(0,_.jsx)(G,{active:o===e,type:`button`,onClick:()=>s(e),children:Z[e]},e))}),(0,_.jsxs)(q,{children:[(0,_.jsx)(p,{rows:D,columns:C,className:`orders-table`}),(0,_.jsx)(R,{currentPage:h,totalPages:T,onChange:v})]}),(0,_.jsx)(d,{open:t,position:`bottom`,title:`Ստեղծել նոր պատվեր`,onClose:()=>n(!1),children:(0,_.jsx)(E,{onClose:()=>n(!1)})})]})};export{_e as default};