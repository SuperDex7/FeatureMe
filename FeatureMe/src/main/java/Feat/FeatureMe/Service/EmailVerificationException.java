package Feat.FeatureMe.Service;

import org.springframework.http.HttpStatus;

/** A signup verification step failed; the message is safe to show the user. */
public class EmailVerificationException extends RuntimeException {

    private final HttpStatus status;

    public EmailVerificationException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
