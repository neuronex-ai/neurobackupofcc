import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseSpeechRecognitionProps {
  onResult?: (text: string) => void;
  lang?: string;
}

export const useSpeechRecognition = ({ onResult, lang = 'pt-BR' }: UseSpeechRecognitionProps = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const isIntentionalStop = useRef(false);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Seu navegador não suporta reconhecimento de fala.");
      return;
    }

    try {
      if (recognitionRef.current && isListening) return;

      isIntentionalStop.current = false;

      // @ts-ignore
      const recognition = new window.webkitSpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true; // Mantém ouvindo mesmo após pausas
      recognition.interimResults = true; // Enable interim results for transcript
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const resultTranscript = event.results[event.results.length - 1][0].transcript;
        const isFinal = event.results[event.results.length - 1].isFinal;

        // Update transcript state
        setTranscript(resultTranscript.trim());

        // Call onResult only for final results
        if (resultTranscript.trim() && onResult && isFinal) {
          onResult(resultTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          setIsListening(false);
          toast.error("Permissão de microfone negada.");
        }
      };

      recognition.onend = () => {
        // Reinicia automaticamente a menos que o usuário tenha parado intencionalmente
        if (!isIntentionalStop.current) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
    } catch (error) {
      console.error(error);
      setIsListening(false);
    }
  }, [lang, onResult, isListening]);

  const stopListening = useCallback(() => {
    isIntentionalStop.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      // Cleanup ao desmontar
      if (recognitionRef.current) {
        isIntentionalStop.current = true;
        recognitionRef.current.stop();
      }
    };
  }, []);

  return { isListening, transcript, startListening, stopListening, toggleListening, resetTranscript };
};