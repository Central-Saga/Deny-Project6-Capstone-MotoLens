<?php

namespace Tests\Unit;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use PHPUnit\Framework\TestCase;

class YoloInferenceScriptTest extends TestCase
{
    protected string $scriptPath;

    protected string $modelPath;

    protected string $metadataPath;

    protected string $pythonBinary;

    protected function setUp(): void
    {
        parent::setUp();

        $this->scriptPath = dirname(__DIR__, 2).'/scripts/yolo_infer.py';
        $this->modelPath = dirname(__DIR__, 2).'/storage/app/ml/model_damage.onnx';
        $this->metadataPath = dirname(__DIR__, 2).'/storage/app/ml/model_metadata.json';
        $envPython = getenv('ML_PYTHON_BINARY');
        $winPython = dirname(__DIR__, 2).'/venv/Scripts/python.exe';
        if ($envPython && (file_exists($envPython) || in_array($envPython, ['python', 'python3'], true))) {
            $this->pythonBinary = $envPython;
        } elseif (file_exists('/opt/venv/bin/python')) {
            $this->pythonBinary = '/opt/venv/bin/python';
        } elseif (file_exists($winPython)) {
            $this->pythonBinary = $winPython;
        } else {
            $this->pythonBinary = 'python3';
        }
    }

    public function test_model_metadata_json_matches_prd_specifications(): void
    {
        $this->assertFileExists($this->metadataPath, 'File model_metadata.json wajib ada.');

        $metadata = json_decode(file_get_contents($this->metadataPath), true);
        $this->assertIsArray($metadata);

        $this->assertSame('model_damage', $metadata['model_name']);
        $this->assertSame('optimized_v2', $metadata['model_version']);
        $this->assertSame(['Accident', 'Dent', 'Scratch'], $metadata['class_names']);
        $this->assertSame([1, 3, 640, 640], $metadata['input_shape']);
        $this->assertSame([1, 7, 8400], $metadata['output_shape']);
        $this->assertEquals(0.35, $metadata['confidence_threshold']);
        $this->assertEquals(0.45, $metadata['nms_iou_threshold']);
        $this->assertSame('letterbox', $metadata['preprocessing_config']['resize']);
        $this->assertSame('RGB', $metadata['preprocessing_config']['color_order']);
    }

    public function test_onnx_model_file_exists_and_sha256_matches(): void
    {
        $this->assertFileExists($this->modelPath, 'Artefak model_damage.onnx wajib ada di storage/app/ml/');

        $sha256 = hash_file('sha256', $this->modelPath);
        $this->assertSame('22ec0d55bdb32939ae8ca5cd4bb1207ab8576f4775f8c5e32359ceb81ab49edd', $sha256);
    }

    public function test_yolo_infer_script_handles_missing_image_gracefully(): void
    {
        $command = [
            $this->pythonBinary,
            $this->scriptPath,
            '--model', $this->modelPath,
            '--input', 'non_existent_image_12345.jpg',
        ];

        $result = Process::run($command);

        $this->assertFalse($result->successful(), 'Script harus return non-zero saat input file tidak ditemukan.');
        $json = json_decode($result->output(), true);

        $this->assertIsArray($json, 'Output stdout harus berupa JSON murni.');
        $this->assertFalse($json['success']);
        $this->assertSame('IMAGE_FILE_NOT_FOUND', $json['error_code']);
    }

    public function test_yolo_infer_script_executes_real_inference_on_sample_image(): void
    {
        // Buat dummy image 640x640 untuk pengujian eksekusi
        $tempImgPath = dirname(__DIR__, 2).'/storage/app/temp_test_image.jpg';
        $tempAnnotatedPath = dirname(__DIR__, 2).'/storage/app/temp_annotated.jpg';

        $img = imagecreatetruecolor(640, 640);
        $bgColor = imagecolorallocate($img, 120, 130, 140);
        imagefill($img, 0, 0, $bgColor);
        imagejpeg($img, $tempImgPath);
        imagedestroy($img);

        $command = [
            $this->pythonBinary,
            $this->scriptPath,
            '--model', $this->modelPath,
            '--input', $tempImgPath,
            '--output', $tempAnnotatedPath,
            '--conf', '0.35',
            '--iou', '0.45',
        ];

        $result = Process::run($command);

        // Cleanup
        if (File::exists($tempImgPath)) {
            File::delete($tempImgPath);
        }
        if (File::exists($tempAnnotatedPath)) {
            File::delete($tempAnnotatedPath);
        }

        $this->assertTrue($result->successful(), 'Script inferensi harus berhasil dieksekusi: '.$result->errorOutput());

        $json = json_decode($result->output(), true);
        $this->assertIsArray($json, 'Output harus berupa JSON murni.');
        $this->assertTrue($json['success']);
        $this->assertArrayHasKey('inference_time_ms', $json);
        $this->assertGreaterThan(0, $json['inference_time_ms']);
        $this->assertSame(640, $json['image']['width']);
        $this->assertSame(640, $json['image']['height']);
        $this->assertArrayHasKey('accident_count', $json['summary']);
        $this->assertArrayHasKey('dent_count', $json['summary']);
        $this->assertArrayHasKey('scratch_count', $json['summary']);
        $this->assertIsArray($json['detections']);
    }
}
