

export const formatTime = (date:string)=>{
  return date.replace('T', ' ').replace('.000Z', '');
}