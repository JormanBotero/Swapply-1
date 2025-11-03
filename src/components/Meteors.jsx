import React from "react";

export const Meteors = ({ number = 15 }) => {
  const meteors = new Array(number).fill(true);
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {meteors.map((_, idx) => (
        <div
          key={"meteor" + idx}
          className="animate-meteor-effect absolute h-1 w-1 bg-white rounded-full shadow-[0_0_10px_2px_#3b82f6]"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
};

export default Meteors;