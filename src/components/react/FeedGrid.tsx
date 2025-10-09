import React from 'react';
import FeedTileSmall from './FeedTileSmall';
import FeedTileBig from './FeedTileBig';
import HeroSlider from './HeroSlider';

type Props = {
  items: any[];         // items lineales del feed (product/banner)
  insertEvery?: number; // cada cuántos bloques metemos un slider (default 3)
  carousels?: Record<string, any[]>; // opcional: data para sliders
};

function chunk<T>(arr:T[], size:number){ const out: T[][] = []; for(let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out; }

export default function FeedGrid({ items, insertEvery = 3, carousels }: Props) {
  // Partimos el feed en grupos de 5 (4 small + 1 big)
  const groups = chunk(items, 5);

  let sliderIdx = 0;
  const sliderKeys = carousels ? Object.keys(carousels) : [];

  return (
    <div className="space-y-6">
      {groups.map((g, i)=>(
        <div key={i} className="space-y-4">
          {/* GRID 4 pequeñas */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {g.slice(0,4).map((it, j)=> <FeedTileSmall key={j} item={it} />)}
          </div>

          {/* 1 grande (producto si lo hay, si no, banner) */}
          {g[4] ? (
            g[4].type === 'product'
              ? <FeedTileBig item={g[4]} />
              : <HeroSlider items={[g[4]]} />
          ) : null}

          {/* Cada N bloques, intercalamos un slider de destacados (si existe data) */}
          {(i>0 && (i+1) % insertEvery === 0 && sliderIdx < sliderKeys.length) ? (
            <div className="mt-1">
              <HeroSlider items={carousels![sliderKeys[sliderIdx++]]} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}










