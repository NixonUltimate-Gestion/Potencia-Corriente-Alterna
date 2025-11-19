
import { GoogleGenAI, Type } from "@google/genai";
import { SimulationState, AnalysisResult } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeCircuit = async (state: SimulationState): Promise<AnalysisResult> => {
  const ai = getClient();
  
  const prompt = `
    Actúa como un asistente experto en Ingeniería Eléctrica (IA).
    Analiza los siguientes datos de simulación de señales AC/DC.
    
    Configuración del Sistema:
    El sistema consta de una carga genérica alimentada por una fuente de Voltaje que resulta en una Corriente.
    
    FUENTE DE VOLTAJE:
    - Forma de onda: ${state.voltage.waveform.toUpperCase()}
    - Amplitud RMS: ${state.voltage.amplitude} V
    - Frecuencia: ${state.voltage.frequency} Hz
    - Ángulo de Fase: ${state.voltage.phase}°
    - Desplazamiento DC: ${state.voltage.dcOffset} V

    SEÑAL DE CORRIENTE:
    - Forma de onda: ${state.current.waveform.toUpperCase()}
    - Amplitud RMS: ${state.current.amplitude} A
    - Frecuencia: ${state.current.frequency} Hz
    - Ángulo de Fase: ${state.current.phase}°
    - Desplazamiento DC: ${state.current.dcOffset} A

    TAREA:
    Realiza un análisis de circuito basado en estos parámetros.
    Nota: Si las formas de onda no son senoidales, considera las implicaciones de los armónicos en tu explicación, aunque los cálculos de fasores estándar se aplican principalmente a la frecuencia fundamental.

    Por favor proporciona:
    1. Impedancia (Z): Magnitud y Ángulo (V_ac / I_ac).
    2. Factor de Potencia: Factor de Potencia de Desplazamiento (basado en la diferencia de fase). Indica si es en Adelanto (Leading) o Atraso (Lagging).
    3. Potencia Real (P): Cálculo de potencia promedio considerando la contribución del componente DC (P_dc + P_ac) si aplica.
    4. Potencia Reactiva (Q): Para la frecuencia fundamental.
    5. Explicación: Explica la naturaleza de la carga (Resistiva, Inductiva, Capacitiva), el efecto del desplazamiento DC en la carga y cómo la forma de onda seleccionada impacta la entrega de potencia en comparación con una onda senoidal pura. Responde en ESPAÑOL.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            impedance: { type: Type.STRING, description: "ej., '5.00Ω ∠ 30.0°'" },
            powerFactor: { type: Type.STRING, description: "ej., '0.866 En atraso'" },
            realPower: { type: Type.STRING, description: "ej., '450 W (Total)'" },
            reactivePower: { type: Type.STRING, description: "ej., '120 VAR'" },
            explanation: { type: Type.STRING, description: "Un párrafo conciso analizando la física del circuito, el tipo de carga y los efectos de la forma de onda en Español." }
          },
          required: ["impedance", "powerFactor", "realPower", "reactivePower", "explanation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      explanation: "Análisis no disponible. Asegúrese de que la clave API esté configurada.",
      impedance: "--",
      powerFactor: "--",
      realPower: "--",
      reactivePower: "--"
    };
  }
};
