

export const formatTime = (date:string)=>{
  const formatedDay=new Date(date).toLocaleString('en-US', {
    timeZone: 'Asia/Yerevan',
    hour12: false
  })
  return formatedDay.replace('T', ' ').replace('.000Z', '');
}

export const getDuration = (start: string, end: string) => {
  const _end = new Date(end || new Date())
  const _start= new Date(start)
  const diffMs = _end.getTime() - _start.getTime();

  if (diffMs <= 0) return '0 ր';

  const totalMinutes = Math.floor(diffMs / 1000 / 60);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} ժ ${minutes} ր`;
  }

  return `${minutes} ր`;
};