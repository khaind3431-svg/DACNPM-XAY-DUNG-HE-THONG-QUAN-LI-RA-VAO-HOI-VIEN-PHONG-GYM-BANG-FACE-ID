package com.titanfit.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request gia hạn gói tập cho hội viên
 */
@Data
public class RenewMemberRequest {

    @NotNull(message = "Vui lòng chọn gói tập mới")
    private Long packageId;
}
