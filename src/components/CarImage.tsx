import { useEffect, useRef, useState } from 'react';
import type { Car } from '../types';
import { OFFICIAL_IMAGE_URL, wikiImage } from '../lib/carImages';
import { CarArt } from './CarArt';

type Stage = 'official' | 'wiki' | 'art';

function useInView<T extends Element>(margin = '300px') {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (!('IntersectionObserver' in window)) return setSeen(true);
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && setSeen(true),
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen] as const;
}

export function CarImage({ car, className = '' }: { car: Car; className?: string }) {
  const [ref, visible] = useInView<HTMLDivElement>();
  const [stage, setStage] = useState<Stage>(OFFICIAL_IMAGE_URL(car.id) ? 'official' : 'wiki');
  const [src, setSrc] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStage(OFFICIAL_IMAGE_URL(car.id) ? 'official' : 'wiki');
    setSrc('');
    setLoaded(false);
  }, [car.id]);

  useEffect(() => {
    if (!visible) return;
    let live = true;
    if (stage === 'official') setSrc(OFFICIAL_IMAGE_URL(car.id));
    else if (stage === 'wiki') {
      wikiImage(car).then((url) => {
        if (!live) return;
        if (url) setSrc(url);
        else setStage('art');
      });
    }
    return () => {
      live = false;
    };
  }, [visible, stage, car]);

  const fail = () => {
    setLoaded(false);
    setSrc('');
    setStage((s) => (s === 'official' ? 'wiki' : 'art'));
  };

  return (
    <div ref={ref} className={`car-image stage-${stage} ${loaded ? 'is-loaded' : ''} ${className}`}>
      <CarArt car={car} />
      {stage !== 'art' && src && (
        <img
          src={src}
          alt={`${car.maker} ${car.name}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            // Some hosts answer missing images with a 1×1 placeholder.
            if ((e.currentTarget.naturalWidth || 0) < 40) fail();
            else setLoaded(true);
          }}
          onError={fail}
        />
      )}
    </div>
  );
}
