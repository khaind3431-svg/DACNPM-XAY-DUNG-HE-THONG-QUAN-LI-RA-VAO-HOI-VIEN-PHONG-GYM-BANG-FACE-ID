package com.titanfit.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Ngoại lệ nghiệp vụ — vi phạm quy tắc kinh doanh (400)
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class BusinessLogicException extends RuntimeException {

    public BusinessLogicException(String message) {
        super(message);
    }
}
