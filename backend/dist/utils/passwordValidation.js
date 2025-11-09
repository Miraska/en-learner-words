"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordValidator = void 0;
class PasswordValidator {
    static validatePassword(password) {
        const errors = [];
        let strengthScore = 0;
        // Check length
        if (password.length < this.MIN_LENGTH) {
            errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
        }
        else {
            strengthScore += 1;
        }
        if (password.length > this.MAX_LENGTH) {
            errors.push(`Password must not exceed ${this.MAX_LENGTH} characters`);
        }
        // Check for uppercase letters
        if (this.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        else if (/[A-Z]/.test(password)) {
            strengthScore += 1;
        }
        // Check for lowercase letters
        if (this.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        else if (/[a-z]/.test(password)) {
            strengthScore += 1;
        }
        // Check for numbers
        if (this.REQUIRE_NUMBERS && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        else if (/\d/.test(password)) {
            strengthScore += 1;
        }
        // Check for special characters (optional, adds to strength)
        if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
            strengthScore += 1;
        }
        // Check for common weak passwords
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
            'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
            'qwerty123', 'dragon', 'master', 'hello', 'freedom', 'whatever',
            'qazwsx', 'trustno1', 'jordan23', 'harley', 'ranger', 'jordan',
            'jennifer', 'hunter', 'buster', 'soccer', 'hockey', 'killer',
            'george', 'sexy', 'andrew', 'charlie', 'superman', 'asshole',
            'fuckyou', 'dallas', 'jessica', 'panties', 'pepper', '1234',
            '12345', '1234567', '12345678', '123456789', '1234567890'
        ];
        if (commonPasswords.includes(password.toLowerCase())) {
            errors.push('Password is too simple and easily guessable');
        }
        // Check for repeated characters - removed this validation
        // if (/(.)\1{2,}/.test(password)) {
        //     errors.push('Password should not contain more than 2 identical characters in a row');
        // }
        // Check for sequential characters - removed this validation
        // if (this.hasSequentialChars(password)) {
        //     errors.push('Password should not contain sequential characters (abc, 123, qwe)');
        // }
        // Determine password strength
        let strength = 'weak';
        if (strengthScore >= 4 && password.length >= 10) {
            strength = 'strong';
        }
        else if (strengthScore >= 2) {
            strength = 'medium';
        }
        return {
            isValid: errors.length === 0,
            errors,
            strength
        };
    }
    static hasSequentialChars(password) {
        const sequences = [
            'abcdefghijklmnopqrstuvwxyz',
            'zyxwvutsrqponmlkjihgfedcba',
            '0123456789',
            '9876543210',
            'qwertyuiop',
            'poiuytrewq',
            'asdfghjkl',
            'lkjhgfdsa',
            'zxcvbnm',
            'mnbvcxz'
        ];
        const lowerPassword = password.toLowerCase();
        for (const sequence of sequences) {
            for (let i = 0; i <= sequence.length - 3; i++) {
                const substr = sequence.substring(i, i + 3);
                if (lowerPassword.includes(substr)) {
                    return true;
                }
            }
        }
        return false;
    }
    static getPasswordRequirements() {
        return [
            `At least ${this.MIN_LENGTH} characters`,
            'Include numbers',
            'Avoid common passwords'
        ];
    }
}
exports.PasswordValidator = PasswordValidator;
PasswordValidator.MIN_LENGTH = 8;
PasswordValidator.MAX_LENGTH = 128;
PasswordValidator.REQUIRE_UPPERCASE = false; // Not required, just adds to strength
PasswordValidator.REQUIRE_LOWERCASE = false; // Not required, just adds to strength
PasswordValidator.REQUIRE_NUMBERS = true;
PasswordValidator.REQUIRE_SPECIAL_CHARS = false; // Simplified - no special chars required
PasswordValidator.SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
