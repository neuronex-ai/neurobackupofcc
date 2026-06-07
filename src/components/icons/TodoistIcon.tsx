"use client";


export const TodoistIcon = ({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <div className={`${className} relative group transition-all duration-500`}>
      <img 
        src="/images/integrations/todoist_black.png" 
        alt="Todoist"
        className="
          w-full h-full object-contain dark:hidden
          transition-all duration-500 ease-out
          opacity-50 grayscale
          group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110
        "
      />
      <img 
        src="/images/integrations/todoist_white.png" 
        alt="Todoist"
        className="
          w-full h-full object-contain hidden dark:block
          transition-all duration-500 ease-out
          opacity-30 grayscale
          group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-110
        "
      />
    </div>
  );
};
