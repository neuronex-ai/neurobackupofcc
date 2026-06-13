import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Starfield } from "@/components/ui/starfield";
import { FadeIn } from "@/components/animations/FadeIn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ArrowUpRight, BookOpen, X, ChevronRight, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// --- Data Structure ---

interface BlogPost {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  content: React.ReactNode;
  image: string;
  readTime: string;
  date: string;
  featured?: boolean;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: "IA na Clínica: Copiloto ou Substituto?",
    category: "Inteligência Artificial",
    excerpt: "Exploramos como os Grandes Modelos de Linguagem (LLMs) estão transformando a transcrição de sessões e a análise de padrões clínicos, mantendo a ética e a humanidade no centro do tratamento.",
    readTime: "8 min de leitura",
    date: "2 Out, 2025",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2865&auto=format&fit=crop",
    featured: true,
    content: (
      <>
        <p className="lead text-xl text-white/90 leading-relaxed mb-8">
          A inteligência artificial chegou aos consultórios de psicologia, não para substituir o terapeuta, mas para libertá-lo das tarefas que não exigem empatia humana.
        </p>
        <h3 className="text-2xl font-bold text-white mt-10 mb-4">A Revolução da Transcrição</h3>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Imagine terminar uma sessão de 50 minutos e ter, instantaneamente, um resumo estruturado com os principais tópicos abordados, o sentimento predominante do paciente e sugestões de intervenção baseadas em TCC ou Psicanálise. Isso já é realidade.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Ferramentas como o <strong>NeuroNex AI</strong> utilizam modelos de linguagem treinados em contextos clínicos para garantir que nuances sutis da fala não sejam perdidas. Diferente de gravadores comuns, o sistema entende o contexto terapêutico.
        </p>
        <h3 className="text-2xl font-bold text-white mt-10 mb-4">Ética e Privacidade</h3>
        <p className="text-muted-foreground leading-relaxed mb-6">
          O maior desafio não é técnico, é ético. Como garantir que os segredos do paciente permaneçam seguros? A resposta está na arquitetura <em>Zero-Knowledge</em> e no processamento local ou em nuvens privadas blindadas.
        </p>
        <blockquote className="border-l-4 border-primary pl-6 py-2 my-10 italic text-white/80 text-lg bg-white/5 rounded-r-xl">
          "A tecnologia deve ser invisível durante a sessão. O foco total deve estar no paciente, enquanto a IA trabalha nos bastidores."
        </blockquote>
      </>
    )
  },
  {
    id: 2,
    title: "Criptografia além do cadeado",
    category: "Segurança",
    excerpt: "Entenda por que a conformidade com a LGPD é apenas o começo e como a arquitetura Zero-Knowledge protege os segredos dos seus pacientes.",
    readTime: "5 min de leitura",
    date: "28 Set, 2025",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2940&auto=format&fit=crop",
    content: (
        <>
            <p className="text-muted-foreground leading-relaxed mb-6">
                A segurança de dados em saúde mental exige mais do que senhas fortes. Exige uma arquitetura onde o provedor do serviço não tenha a chave para ler os dados.
            </p>
            <h3 className="text-2xl font-bold text-white mt-8 mb-4">O que é Zero-Knowledge?</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
                Em sistemas tradicionais, seus dados são criptografados, mas a empresa tem a chave. Se houver um vazamento ou uma ordem judicial, seus dados podem ser expostos. No modelo Zero-Knowledge, a criptografia acontece no seu dispositivo. Nós armazenamos apenas o "cofre trancado", sem nunca ter acesso à chave.
            </p>
        </>
    )
  },
  {
    id: 3,
    title: "O fim das faltas de última hora",
    category: "Gestão",
    excerpt: "Como sistemas de agendamento inteligentes e lembretes contextuais reduziram o no-show em 40% nas clínicas parceiras.",
    readTime: "4 min de leitura",
    date: "15 Set, 2025",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2940&auto=format&fit=crop",
    content: (
        <>
            <p className="text-muted-foreground leading-relaxed mb-6">
                O no-show é um dos maiores ralos financeiros de um consultório. A solução não é cobrar antecipado (apenas), é engajar o paciente.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
                <li>Confirmações via WhatsApp com 24h de antecedência.</li>
                <li>Lembretes de "preparo mental" 1h antes da sessão.</li>
                <li>Facilidade de reagendamento sem atrito humano.</li>
            </ul>
        </>
    )
  },
  {
    id: 4,
    title: "Burnout no Consultório",
    category: "Carreira",
    excerpt: "Estratégias baseadas em dados para psicólogos gerenciarem sua própria carga de trabalho e evitarem a fadiga por compaixão.",
    readTime: "6 min de leitura",
    date: "10 Set, 2025",
    image: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?q=80&w=2940&auto=format&fit=crop",
    content: (
        <>
            <p className="text-muted-foreground leading-relaxed mb-6">
                Cuidar de quem cuida. A fadiga por compaixão é real e mensurável. Monitorar seu volume de atendimentos e a complexidade dos casos é vital.
            </p>
        </>
    )
  },
  {
    id: 5,
    title: "O futuro da Telemedicina",
    category: "Tecnologia",
    excerpt: "Realidade virtual, monitoramento remoto e as novas fronteiras do atendimento psicológico à distância.",
    readTime: "7 min de leitura",
    date: "05 Set, 2025",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2940&auto=format&fit=crop",
    content: (
        <>
            <p className="text-muted-foreground leading-relaxed mb-6">
                A teleconsulta de hoje é apenas uma chamada de vídeo. O futuro envolve ambientes imersivos de VR para exposição controlada e biofeedback em tempo real.
            </p>
        </>
    )
  },
  {
    id: 6,
    title: "Deep Work para Terapeutas",
    category: "Produtividade",
    excerpt: "Como organizar sua agenda para maximizar o foco nas sessões e minimizar o tempo gasto em tarefas administrativas.",
    readTime: "5 min de leitura",
    date: "01 Set, 2025",
    image: "https://images.unsplash.com/photo-1555421689-d68471e189f2?q=80&w=2940&auto=format&fit=crop",
    content: (
        <>
            <p className="text-muted-foreground leading-relaxed mb-6">
                Agrupar tarefas administrativas (batching), usar blocos de tempo para evolução de prontuários e automatizar o financeiro são chaves para manter a sanidade mental do terapeuta.
            </p>
        </>
    )
  }
];

// --- Components ---

const ArticleCard = ({ post, onClick, delay }: { post: BlogPost, onClick: () => void, delay: number }) => (
  <FadeIn delay={delay} className={cn(post.featured ? "col-span-1 md:col-span-2 lg:col-span-3" : "col-span-1")}>
      <div className="group cursor-pointer h-full flex flex-col" onClick={onClick}>
          <div className={cn(
              "relative overflow-hidden rounded-[24px] border border-white/10 mb-6 transition-all duration-700 group-hover:shadow-2xl group-hover:shadow-primary/5 bg-[#0A0A0B]",
              post.featured ? "aspect-[21/9]" : "aspect-[4/3]"
          )}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />
              <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute top-6 left-6 z-20">
                  <Badge className="bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                    {post.category}
                  </Badge>
              </div>
              {post.featured && (
                   <div className="absolute bottom-8 left-8 z-20 hidden md:block">
                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Em Destaque
                        </p>
                   </div>
              )}
          </div>
          
          <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {post.readTime}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{post.date}</span>
              </div>
              <h3 className={cn(
                  "font-bold text-white leading-[1.1] mb-4 group-hover:text-primary transition-colors",
                  post.featured ? "text-3xl md:text-5xl tracking-tight" : "text-xl"
              )}>
                  {post.title}
              </h3>
              <p className={cn(
                  "text-muted-foreground leading-relaxed font-light",
                  post.featured ? "text-lg max-w-3xl mb-6" : "text-sm line-clamp-3 mb-4"
              )}>
                  {post.excerpt}
              </p>
              
              <div className="mt-auto flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider group-hover:translate-x-2 transition-transform">
                  Ler Artigo <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
          </div>
      </div>
  </FadeIn>
);

const BlogModal = ({ post, open, onClose, onNavigate }: { post: BlogPost | null, open: boolean, onClose: () => void, onNavigate: (post: BlogPost) => void }) => {
    if (!post) return null;

    // Filter related posts (excluding current)
    const relatedPosts = BLOG_POSTS.filter(p => p.id !== post.id).slice(0, 3);

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 border border-white/10 bg-[#050505] shadow-2xl flex flex-col rounded-[32px] outline-none">
                
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <Button size="icon" variant="ghost" className="rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-white/10 border border-white/10">
                        <Share2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-white/10 border border-white/10">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {/* Hero Image */}
                    <div className="relative w-full h-[400px] md:h-[500px] shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent z-10" />
                        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                        
                        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20">
                            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
                                {post.category}
                            </Badge>
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-tighter leading-[1.1] max-w-4xl drop-shadow-xl">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-4 mt-6 text-sm text-white/80 font-medium">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" /> {post.readTime}
                                </div>
                                <span className="w-1 h-1 rounded-full bg-white/30" />
                                <span>{post.date}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="px-6 md:px-12 py-12 max-w-4xl mx-auto">
                        <div className="prose prose-invert prose-lg max-w-none">
                            {post.content}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />

                    {/* Related Articles */}
                    <div className="px-6 md:px-12 pb-16 bg-[#0A0A0B]">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" /> Leia Também
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedPosts.map(related => (
                                <div 
                                    key={related.id} 
                                    onClick={() => onNavigate(related)}
                                    className="group cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all"
                                >
                                    <div className="aspect-video rounded-xl overflow-hidden mb-4 relative">
                                        <img src={related.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">{related.category}</p>
                                    <h4 className="text-sm font-bold text-white leading-snug group-hover:text-white/80 transition-colors">
                                        {related.title}
                                    </h4>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const Blog = () => {
  useSmoothScroll();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenPost = (post: BlogPost) => {
      setSelectedPost(post);
      setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#020204] text-foreground relative overflow-x-hidden font-sans selection:bg-primary/30">
      <Navbar />
      <Starfield />
      
      {/* --- Hero --- */}
      <section className="pt-48 pb-24 px-6 relative z-10">
          <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[150px] pointer-events-none z-0 opacity-40" />
          
          <div className="max-w-7xl mx-auto text-center">
              <FadeIn>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 mb-8 shadow-glass">
                    <BookOpen className="w-5 h-5 text-white/80" />
                </div>
              </FadeIn>
              
              <FadeIn delay={0.1}>
                <h1 className="text-5xl md:text-8xl font-medium tracking-tighter text-white mb-8">
                    The Synapse
                </h1>
              </FadeIn>
              
              <FadeIn delay={0.2}>
                <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
                    Insights profundos sobre a intersecção entre tecnologia, psicologia clínica e o futuro da saúde mental.
                </p>
              </FadeIn>
          </div>
      </section>

      {/* --- Content Grid --- */}
      <section className="pb-32 px-6 relative z-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
              {BLOG_POSTS.map((post, i) => (
                  <ArticleCard 
                    key={post.id} 
                    post={post} 
                    delay={0.3 + (i * 0.1)} 
                    onClick={() => handleOpenPost(post)}
                  />
              ))}
          </div>
          
          <div className="mt-32 text-center">
              <Button variant="outline" className="rounded-full px-10 h-14 border-white/10 hover:bg-white hover:text-black text-white text-xs font-bold uppercase tracking-widest transition-all hover:scale-105">
                  Carregar Mais Artigos
              </Button>
          </div>
      </section>

      <BlogModal 
        post={selectedPost} 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onNavigate={(post) => setSelectedPost(post)}
      />

      <Footer />
    </div>
  );
};

export default Blog;