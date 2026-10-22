package com.titanfit.service;

import org.springframework.stereotype.Service;

/**
 * Service xử lý sinh trắc học — so khớp khuôn mặt, cosine similarity
 * Port từ gymLogic.ts sang Java
 */
@Service
public class BiometricService {

    /**
     * Chuẩn hóa vector (zero-center + L2 normalize)
     */
    public double[] normalizeVector(double[] vec) {
        if (vec == null || vec.length == 0) return new double[0];

        // Zero-center
        double mean = 0;
        for (double v : vec) mean += v;
        mean /= vec.length;

        double[] centered = new double[vec.length];
        for (int i = 0; i < vec.length; i++) {
            centered[i] = vec[i] - mean;
        }

        // L2 normalize
        double norm = 0;
        for (double v : centered) norm += v * v;
        norm = Math.sqrt(norm);

        if (norm < 1e-10) return centered;

        double[] normalized = new double[vec.length];
        for (int i = 0; i < vec.length; i++) {
            normalized[i] = centered[i] / norm;
        }
        return normalized;
    }

    /**
     * Tính cosine similarity giữa 2 vector, trả về 0-100%
     */
    public double calculateCosineSimilarity(double[] vecA, double[] vecB) {
        if (vecA == null || vecB == null || vecA.length != vecB.length || vecA.length == 0) {
            return 0.0;
        }

        double[] normA = normalizeVector(vecA);
        double[] normB = normalizeVector(vecB);

        double dotProduct = 0;
        double normAMag = 0;
        double normBMag = 0;

        for (int i = 0; i < normA.length; i++) {
            dotProduct += normA[i] * normB[i];
            normAMag += normA[i] * normA[i];
            normBMag += normB[i] * normB[i];
        }

        double denominator = Math.sqrt(normAMag) * Math.sqrt(normBMag);
        if (denominator < 1e-10) return 0.0;

        double similarity = dotProduct / denominator;
        // Clamp -1 to 1, scale to 0-100
        similarity = Math.max(-1.0, Math.min(1.0, similarity));
        return ((similarity + 1.0) / 2.0) * 100.0;
    }

    /**
     * Chuyển face vector entity (16 cột) thành mảng double[]
     */
    public double[] entityToArray(com.titanfit.entity.FaceVector fv) {
        return new double[]{
            fv.getV0(), fv.getV1(), fv.getV2(), fv.getV3(),
            fv.getV4(), fv.getV5(), fv.getV6(), fv.getV7(),
            fv.getV8(), fv.getV9(), fv.getV10(), fv.getV11(),
            fv.getV12(), fv.getV13(), fv.getV14(), fv.getV15()
        };
    }

    /**
     * Gán mảng double[] vào face vector entity
     */
    public void arrayToEntity(double[] arr, com.titanfit.entity.FaceVector fv) {
        if (arr == null || arr.length < 16) return;
        fv.setV0(arr[0]);  fv.setV1(arr[1]);  fv.setV2(arr[2]);  fv.setV3(arr[3]);
        fv.setV4(arr[4]);  fv.setV5(arr[5]);  fv.setV6(arr[6]);  fv.setV7(arr[7]);
        fv.setV8(arr[8]);  fv.setV9(arr[9]);  fv.setV10(arr[10]); fv.setV11(arr[11]);
        fv.setV12(arr[12]); fv.setV13(arr[13]); fv.setV14(arr[14]); fv.setV15(arr[15]);
    }
}
