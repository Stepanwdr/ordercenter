import{a as e,s as t,t as n}from"./jsx-runtime-D1CT_DlN.js";import{c as r,l as i}from"./chunk-OE4NN4TA-Dp4l5uPd.js";import{t as a}from"./dataApi-BpCh87Z0.js";import{t as o}from"./Button-EnPxuzX1.js";t();var s=n(),c={new:`#9ca3ff`,cooking:`#f59e0b`,ready:`#38bdf8`,delivering:`#9d7cff`,done:`#34d399`},l=e.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  background: ${({status:e})=>c[e]??`#64748b`};
`,u=({status:e})=>(0,s.jsx)(l,{status:e,children:e.toUpperCase()}),d=e.main`
  padding: 32px;
  box-sizing: border-box;
  width: 100%;
`,f=e.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  flex-wrap: wrap;
`,p=e.div`
  display: grid;
  gap: 12px;
`,m=e.h1`
  margin: 0;
  font-size: 2rem;
`,h=e.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  max-width: 620px;
`,g=e.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`,_=e.section`
  padding: 28px;
  border-radius: 24px;
  background: rgba(18, 24, 44, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.14);
`,v=e.h2`
  margin: 0 0 16px;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
`,y=e.p`
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.7;
`,b=e.div`
  display: grid;
  gap: 20px;
`,x=e.h3`
  margin: 0;
  font-size: 1.1rem;
`,S=e.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.75;
`,C=e(o)`
  min-width: 160px;
`,w=()=>{let{id:e}=i(),t=r(),{data:n,isPending:o}=a(e??null);if(o)return(0,s.jsx)(d,{children:(0,s.jsx)(m,{children:`Բեռնվում է`})});if(!n?.data)return(0,s.jsx)(d,{children:(0,s.jsx)(m,{children:`Courier not found`})});let c=n?.data??{},l=c?.status===`free`;return(0,s.jsxs)(d,{children:[(0,s.jsxs)(f,{children:[(0,s.jsxs)(p,{children:[(0,s.jsx)(m,{children:c?.user?.name}),(0,s.jsx)(h,{children:`Полная карточка курьера с текущим статусом, контактами и последней информацией о доставке.`})]}),(0,s.jsx)(`div`,{children:(0,s.jsx)(u,{status:c?.status})})]}),(0,s.jsxs)(g,{children:[(0,s.jsxs)(_,{children:[(0,s.jsx)(v,{children:`Контактный телефон`}),(0,s.jsx)(y,{children:c?.user?.phone})]}),c?.restaurant?.name&&(0,s.jsxs)(_,{children:[(0,s.jsx)(v,{children:`Ресторан`}),(0,s.jsx)(y,{children:c?.restaurant?.name})]}),(0,s.jsx)(_,{children:(0,s.jsx)(v,{children:`Текущий заказ`})}),(0,s.jsx)(_,{children:(0,s.jsx)(v,{children:`Расположение`})})]}),(0,s.jsxs)(b,{children:[(0,s.jsx)(x,{children:`Детали`}),(0,s.jsx)(S,{children:l?`Курьер активно доставляет заказ. Поддерживайте связь через систему и отслеживайте время доставки.`:`Курьер свободен и готов к новым заданиям. Вы можете изменить его статус или назначить новый заказ.`}),(0,s.jsx)(C,{variant:`secondary`,onClick:()=>t(`/couriers`),children:`Հետ առաքիչների ցուցակը`})]})]})};export{w as default};