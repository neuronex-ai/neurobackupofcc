"use client";


export const TodoistIcon = ({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <div className={`${className} relative group transition-all duration-500`}>
      {/* Modo Claro: Inativo (Cinza) -> Ativo (Vermelho/Colorido) */}
      <img 
        src="/@docs/logos/todoist_colored.png" 
        alt="Todoist"
        className="
          w-full h-full object-contain dark:hidden
          transition-all duration-500 ease-out
          grayscale opacity-40 brightness-150
          group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110
        "
      />
      {/* Modo Escuro: Inativo (Cinza) -> Ativo (Branco) */}
      <img 
        src="/@docs/logos/todoist_white.png" 
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