export default function formatDateTime(isoDateString:string) {
    if (!isoDateString) return ''; // 处理空值
    const date = new Date(isoDateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // 提取并格式化各部分
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    console.log(year,month,day,hour,minute)
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }