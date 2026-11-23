<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ReportStatus;
use App\Http\Controllers\Api\Concerns\ApiResponseTrait;
use App\Http\Controllers\Controller;
use App\Http\Resources\ReportResource;
use App\Models\Motorcycle;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ReportController extends Controller
{
    use ApiResponseTrait;

    /**
     * Laporkan listing motor yang mencurigakan, penipuan, atau data palsu.
     */
    public function store(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $motorcycle = Motorcycle::findOrFail($id);

        if ($motorcycle->user_id === $user->id) {
            return $this->errorResponse(
                message: 'Anda tidak dapat melaporkan listing motor milik Anda sendiri.',
                statusCode: Response::HTTP_UNPROCESSABLE_ENTITY,
                errors: ['motorcycle_id' => ['Anda adalah pemilik unit motor ini.']]
            );
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
        ], [
            'reason.required' => 'Alasan pelaporan wajib diisi.',
            'reason.max' => 'Alasan pelaporan maksimal 120 karakter.',
        ]);

        $report = Report::create([
            'motorcycle_id' => $motorcycle->id,
            'reporter_id' => $user->id,
            'reason' => $validated['reason'],
            'description' => $validated['description'] ?? null,
            'status' => ReportStatus::Open->value,
        ]);

        $report->load(['motorcycle', 'reporter']);

        return $this->createdResponse(
            data: new ReportResource($report),
            message: 'Laporan listing berhasil dikirim dan akan ditinjau oleh tim moderator.'
        );
    }
}
