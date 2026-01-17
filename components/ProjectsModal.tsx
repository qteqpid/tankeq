
import React from 'react';
import { Project } from '../types';

interface ProjectsModalProps {
  projects: Project[];
  onLoad: (project: Project) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const ProjectsModal: React.FC<ProjectsModalProps> = ({ projects, onLoad, onDelete, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-fade-in">
      <div className="bg-[#0f0f0f] w-full max-w-3xl rounded-2xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col overflow-hidden max-h-[85vh]">
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#141414]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <i className="fa-solid fa-vault text-cyan-500"></i>
            </div>
            <div>
              <h2 className="text-sm font-black tracking-widest text-gray-200 uppercase italic">宇宙项目档案库</h2>
              <p className="text-[9px] text-gray-600 font-mono">WORKSPACE // {projects.length} SAVED_STATES</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-600 hover:text-white transition-all"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto scrollbar-hide grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-20 flex flex-col items-center">
              <i className="fa-solid fa-inbox fa-3x mb-4"></i>
              <p className="text-xs font-bold uppercase tracking-[0.3em]">尚未发现保存的项目记录</p>
            </div>
          ) : (
            projects.map(p => (
              <div 
                key={p.id}
                className="group relative bg-[#1a1a1a] border border-white/5 rounded-xl p-5 hover:border-white/20 hover:bg-[#222] transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate max-w-[180px]">
                      {p.name}
                    </h3>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${p.mode === 'physics' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                      {p.mode === 'physics' ? '物理核心' : '星系模拟'}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                    className="text-[10px] text-gray-700 hover:text-red-500 transition-colors p-2"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-gray-600 uppercase">最后修改</span>
                    <span className="text-[9px] text-gray-400 font-mono">{new Date(p.timestamp).toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={() => onLoad(p)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded text-[9px] font-bold uppercase tracking-widest text-gray-500 group-hover:bg-white/10 group-hover:text-white transition-all"
                  >
                    载入项目
                  </button>
                </div>
                
                <div className="mt-4 flex gap-4 opacity-30 text-[8px] font-mono">
                  <span>PLANETS: {p.planets.length}</span>
                  {p.mode === 'physics' && <span>WALLS: {p.walls.length}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-[#0a0a0a] border-t border-white/5 flex justify-between items-center text-[9px] font-mono text-gray-600">
          <span>COSMOS_PERSISTENCE_LAYER_v1.0</span>
          <button 
            onClick={onClose}
            className="px-8 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            返回工作区
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectsModal;
