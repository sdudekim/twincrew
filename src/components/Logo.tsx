import React from 'react';

const Logo = () => {
  const handleClick = () => {
    alert("On the Job Training");
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <img 
        src="/lovable-uploads/5c457252-cdab-4755-aec3-3e47bac7b618.png" 
        alt="LG Logo" 
        className="h-10 w-auto opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
        onClick={handleClick}
      />
    </div>
  );
};

export default Logo;