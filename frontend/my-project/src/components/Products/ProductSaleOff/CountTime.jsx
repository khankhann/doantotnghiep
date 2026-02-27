import { useEffect, useState } from "react";

function CountTime() {
  const calculateTimeLeft = () => {
    // Đặt ngày kết thúc sự kiện (Flash Sale, v.v.)
    const currentDay = "2026-10-28T00:00:00";
    const diffrent = new Date(currentDay).getTime() - new Date().getTime();
    
    let counter = {};
    const SECOND = 1000;
    const MIN = SECOND * 60;
    const HOURS = MIN * 60;
    const DAYS = HOURS * 24;

    if (diffrent > 0) {
      counter = {
        days: Math.floor(diffrent / DAYS),
        hours: Math.floor((diffrent % DAYS) / HOURS),
        min: Math.floor((diffrent % HOURS) / MIN),
        sec: Math.floor((diffrent % MIN) / SECOND),
      };
    }
    return counter;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const timeKeys = Object.keys(timeLeft);


  if (timeKeys.length === 0) {
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="bg-red-100 text-red-600 font-bold px-6 py-3 rounded-full shadow-sm text-lg tracking-wide border border-red-200">
          🔥 Sự kiện đã kết thúc! 🔥
        </span>
      </div>
    );
  }


  return (
    <div className="mt-12 mb-8">
  
      <h3 className="text-center text-white text-2xl font-bold text-gray-800 mb-6 uppercase tracking-wider">
        Flash Sale Kết Thúc Trong
      </h3>

   
      <div className="flex justify-center items-center gap-3 sm:gap-6">
        {timeKeys.map((interval) => {
          return (
            <div 
              key={interval}
              className="flex flex-col items-center justify-center bg-white shadow-lg border border-gray-100 rounded-xl w-20 h-24 sm:w-24 sm:h-28 transition-transform duration-500 hover:scale-105"
            >
            
              <span className="text-3xl sm:text-4xl font-black text-red-500">
                {timeLeft[interval].toString().padStart(2, "0")}
              </span>
              
     
              <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase mt-2 tracking-widest">
                {interval}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CountTime;