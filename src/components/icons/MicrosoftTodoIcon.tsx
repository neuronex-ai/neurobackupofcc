"use client";


export const MicrosoftTodoIcon = ({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <div className={`${className} relative group transition-all duration-500`}>
      <img 
        src="/@docs/logos/microsoft_todo_colored.png" 
        alt="Microsoft Todo"
        className="
          w-full h-full object-contain
          transition-all duration-500 ease-out
          grayscale opacity-40 brightness-125 dark:brightness-100
          group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110
        "
      />
    </div>
  );
};