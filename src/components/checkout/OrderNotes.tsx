import React from 'react';

interface OrderNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

export default function OrderNotes({ notes, onNotesChange }: OrderNotesProps) {
  return (
    <div className="checkout-card rounded-2xl bg-[#1D2939] ring-1 ring-white/10 shadow-lg p-4">
      <h2 className="text-white text-lg font-semibold mb-4">Notas del Pedido</h2>
      
      <div>
        <label className="block text-white/70 text-sm mb-2">
          Instrucciones para el repartidor (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Ej: Llamar antes de llegar, dejar en portería, etc."
          rows={3}
          maxLength={200}
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-white/50 text-xs">
            Máximo 200 caracteres
          </p>
          <span className="text-white/50 text-xs">
            {notes.length}/200
          </span>
        </div>
      </div>
    </div>
  );
}
