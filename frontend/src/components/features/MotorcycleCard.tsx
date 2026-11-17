'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Gauge,
  Heart,
  MapPin,
  Scale,
  Check,
  Sparkles,
} from 'lucide-react';
import type { MotorcycleListItem } from '@/types/motorcycle';
import { PriceBadge } from '@/components/shared/PriceBadge';
import { ConditionBadge } from '@/components/shared/ConditionBadge';
import { VerificationBadge } from '@/components/shared/VerificationBadge';
import { DamageSummaryPills } from '@/components/shared/DamageSummaryPills';
import { useAuth } from '@/hooks/useAuth';
import { useCompare } from '@/hooks/useCompare';
import { motorcycleService } from '@/services/motorcycleService';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface MotorcycleCardProps {
  motorcycle: MotorcycleListItem;
  onFavoriteToggled?: (id: number, isFavorited: boolean) => void;
}

export function MotorcycleCard({
  motorcycle,
  onFavoriteToggled,
}: MotorcycleCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isInCompare, toggleCompare } = useCompare();

  const [favorited, setFavorited] = useState<boolean>(
    Boolean(motorcycle.is_favorited)
  );
  const [togglingFav, setTogglingFav] = useState<boolean>(false);
  const [compareMsg, setCompareMsg] = useState<string | null>(null);

  const inCompare = isInCompare(motorcycle.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (togglingFav) return;
    setTogglingFav(true);
    try {
      const res = await motorcycleService.toggleFavorite(motorcycle.id);
      setFavorited(res.data.is_favorited);
      onFavoriteToggled?.(motorcycle.id, res.data.is_favorited);
    } catch {
      // Ignore error
    } finally {
      setTogglingFav(false);
    }
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = toggleCompare({
      id: motorcycle.id,
      title: motorcycle.title,
      brand: motorcycle.brand,
      model_name: motorcycle.model_name,
      seller_price: motorcycle.seller_price,
      main_image_url: motorcycle.main_image_url,
    });
    if (res.limitReached) {
      setCompareMsg('Maksimal 3 unit komparasi');
      setTimeout(() => setCompareMsg(null), 2500);
    }
  };

  const imageUrl =
    motorcycle.main_image_url ||
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden">
      {/* Image Header */}
      <div className="relative h-48 bg-slate-100 overflow-hidden">
        <Link href={`/motorcycles/${motorcycle.id}`} className="block w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={motorcycle.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Top Left Price Badge */}
        <div className="absolute top-3 left-3">
          <PriceBadge label={motorcycle.price_label} size="sm" />
        </div>

        {/* Top Right Favorite & Compare Buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCompareClick}
            className={`p-2 rounded-xl backdrop-blur-md transition shadow-xs ${
              inCompare
                ? 'bg-indigo-600 text-white'
                : 'bg-white/90 text-slate-700 hover:bg-white'
            }`}
            title={
              inCompare ? 'Hapus dari komparasi' : 'Tambah ke komparasi (2-3 unit)'
            }
          >
            {inCompare ? (
              <Check className="w-4 h-4" />
            ) : (
              <Scale className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleFavoriteClick}
            disabled={togglingFav}
            className={`p-2 rounded-xl backdrop-blur-md transition shadow-xs ${
              favorited
                ? 'bg-rose-600 text-white'
                : 'bg-white/90 text-slate-700 hover:text-rose-600 hover:bg-white'
            }`}
            title={favorited ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
          >
            <Heart
              className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`}
            />
          </button>
        </div>

        {/* Status Banner if booked/sold */}
        {motorcycle.status !== 'available' && (
          <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-md bg-slate-900/90 text-white text-[11px] font-bold uppercase">
            {motorcycle.status === 'booked' ? 'Dibooking Survei' : 'Terjual'}
          </div>
        )}

        {compareMsg && (
          <div className="absolute bottom-2 inset-x-3 bg-slate-900/95 text-white text-xs font-semibold py-1.5 px-3 rounded-lg text-center">
            {compareMsg}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2.5">
          {/* Verification & Condition Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <ConditionBadge grade={motorcycle.condition_grade} />
            <VerificationBadge
              sourceType={motorcycle.source_type}
              isCameraVerified={motorcycle.is_camera_verified}
            />
          </div>

          {/* Title */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              {motorcycle.brand} • {motorcycle.model_name} ({motorcycle.engine_cc}cc)
            </p>
            <Link
              href={`/motorcycles/${motorcycle.id}`}
              className="text-base font-bold text-slate-900 hover:text-indigo-600 line-clamp-1 transition"
            >
              {motorcycle.title}
            </Link>
          </div>

          {/* Specs Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{motorcycle.year}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatNumber(motorcycle.odometer_km)} km</span>
            </span>
            <span className="inline-flex items-center gap-1 truncate max-w-[160px]">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{motorcycle.location_address}</span>
            </span>
          </div>

          {/* AI Damage Summary Pills */}
          {motorcycle.inspection_summary && (
            <div className="pt-1">
              <DamageSummaryPills
                scratch={motorcycle.inspection_summary.scratch_count}
                dent={motorcycle.inspection_summary.dent_count}
                accident={motorcycle.inspection_summary.accident_count}
                compact
              />
            </div>
          )}
        </div>

        {/* Price Comparison Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] text-slate-500">Harga Penjual</p>
            <p className="text-lg font-extrabold text-slate-900">
              {formatCurrency(motorcycle.seller_price)}
            </p>
            <p className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>
                Estimasi AI: {formatCurrency(motorcycle.ml_predicted_price)}
              </span>
            </p>
          </div>

          <Link
            href={`/motorcycles/${motorcycle.id}`}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition shrink-0"
          >
            Sertifikat AI
          </Link>
        </div>
      </div>
    </div>
  );
}
