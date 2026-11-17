'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  FileCheck2,
  Gauge,
  Heart,
  MapPin,
  Scale,
  Check,
  Sparkles,
  ArrowUpRight,
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

  const isTaxActive = motorcycle.tax_status === 'active';

  return (
    <div className="group bg-white rounded-2xl border border-zinc-200/80 hover:border-red-500/60 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Showroom Image Header */}
      <div className="relative h-52 bg-zinc-900 overflow-hidden">
        <Link href={`/motorcycles/${motorcycle.id}`} className="block w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={motorcycle.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />
        </Link>

        {/* Top Left Semantic Price Badge (PRD Compliant) */}
        <div className="absolute top-3 left-3">
          <PriceBadge label={motorcycle.price_label} size="sm" />
        </div>

        {/* Top Right Round Favorite & Compare Buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCompareClick}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition shadow-md ${
              inCompare
                ? 'bg-red-600 text-white'
                : 'bg-white/95 text-zinc-800 hover:bg-red-600 hover:text-white'
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
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition shadow-md ${
              favorited
                ? 'bg-red-600 text-white'
                : 'bg-white/95 text-zinc-800 hover:text-red-600 hover:bg-white'
            }`}
            title={favorited ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
          >
            <Heart
              className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`}
            />
          </button>
        </div>

        {/* Bottom Left Condition & Verification Overlay */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex flex-wrap items-center gap-1.5">
            <ConditionBadge grade={motorcycle.condition_grade} />
            <VerificationBadge
              sourceType={motorcycle.source_type}
              isCameraVerified={motorcycle.is_camera_verified}
            />
          </div>

          {motorcycle.status !== 'available' && (
            <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              {motorcycle.status === 'booked' ? 'Dibooking' : 'Terjual'}
            </span>
          )}
        </div>

        {compareMsg && (
          <div className="absolute inset-x-3 bottom-3 bg-zinc-950/95 text-white text-xs font-bold py-1.5 px-3 rounded-lg text-center shadow-lg">
            {compareMsg}
          </div>
        )}
      </div>

      {/* Showroom Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Brand & Title */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-[11px] font-black uppercase tracking-wider text-red-600">
                {motorcycle.brand} • {motorcycle.model_name}
              </p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 uppercase">
                {motorcycle.engine_cc}cc
              </span>
            </div>
            <Link
              href={`/motorcycles/${motorcycle.id}`}
              className="text-base font-extrabold text-zinc-900 group-hover:text-red-600 line-clamp-1 transition-colors"
            >
              {motorcycle.title}
            </Link>
          </div>

          {/* 4-Pill Showroom Specs Strip (Year, Odometer, Tax, Location) */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="font-semibold text-zinc-800">{motorcycle.year}</span>
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <Gauge className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="font-semibold text-zinc-800">
                {formatNumber(motorcycle.odometer_km)} km
              </span>
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <FileCheck2
                className={`w-3.5 h-3.5 shrink-0 ${
                  isTaxActive ? 'text-emerald-600' : 'text-amber-600'
                }`}
              />
              <span
                className={`font-semibold ${
                  isTaxActive ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {isTaxActive ? 'Pajak Hidup' : 'Pajak Mati'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="truncate font-medium text-zinc-700">
                {motorcycle.location_address}
              </span>
            </div>
          </div>

          {/* AI Damage Summary Pills */}
          {motorcycle.inspection_summary && (
            <div>
              <DamageSummaryPills
                scratch={motorcycle.inspection_summary.scratch_count}
                dent={motorcycle.inspection_summary.dent_count}
                accident={motorcycle.inspection_summary.accident_count}
                compact
              />
            </div>
          )}
        </div>

        {/* Showroom Price Comparison & Action Footer */}
        <div className="pt-3.5 border-t border-zinc-100 flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Harga Penjual
            </p>
            <p className="text-lg font-black text-red-600 leading-tight">
              {formatCurrency(motorcycle.seller_price)}
            </p>
            <p className="text-[11px] text-zinc-600 font-semibold flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-red-500 shrink-0" />
              <span>
                Taksiran AI:{' '}
                <strong className="text-zinc-900">
                  {formatCurrency(motorcycle.ml_predicted_price)}
                </strong>
              </span>
            </p>
          </div>

          <Link
            href={`/motorcycles/${motorcycle.id}`}
            className="inline-flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 hover:bg-red-600 text-white text-xs font-extrabold transition-colors shrink-0 shadow-xs"
          >
            <span>Lihat Sertifikat AI</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
