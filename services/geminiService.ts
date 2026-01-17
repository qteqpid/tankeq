import { GoogleGenAI } from "@google/genai";
import { Planet } from "../types";

export const analyzeSystem = async (planets: Planet[]): Promise<string> => {
  // Initialize with process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemDescription = planets.map(p => 
    `${p.name}: ${p.type}, 质量 ${p.mass.toFixed(1)}, 位置 (${p.position.x.toFixed(1)}, ${p.position.y.toFixed(1)})`
  ).join('\n');

  const prompt = `
    分析以下星系模拟系统：
    ${systemDescription}

    请提供一份中文“宇宙演化报告”：
    1. 评估系统的轨道稳定性。
    2. 为质量最大的天体构思一段简短的神话背景。
    3. 预测在接下来的1000个模拟年中，这个系统可能发生的重大天文事件。
    语气要求：宏大、深邃、带有科学幻想色彩。字数控制在200字以内。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.95,
      }
    });
    // Correctly accessing the text property from GenerateContentResponse
    return response.text || "星空静默无声...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "与银河议会的通讯中断。";
  }
};