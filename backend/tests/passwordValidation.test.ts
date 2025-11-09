import { PasswordValidator } from '../src/utils/passwordValidation';

describe('PasswordValidator', () => {
    describe('validatePassword', () => {
        it('should reject password that is too short', () => {
            const result = PasswordValidator.validatePassword('123');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });

        it('should accept password without uppercase letter', () => {
            const result = PasswordValidator.validatePassword('password123');
            expect(result.isValid).toBe(true);
        });

        it('should accept password without lowercase letter', () => {
            const result = PasswordValidator.validatePassword('PASSWORD123');
            expect(result.isValid).toBe(true);
        });

        it('should reject password without numbers', () => {
            const result = PasswordValidator.validatePassword('Password!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should accept password without special characters', () => {
            const result = PasswordValidator.validatePassword('Password123');
            expect(result.isValid).toBe(true);
        });

        it('should reject common passwords', () => {
            const result = PasswordValidator.validatePassword('password');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password is too simple and easily guessable');
        });

        it('should accept passwords with repeated characters', () => {
            const result = PasswordValidator.validatePassword('Password123!!!');
            expect(result.isValid).toBe(true);
        });

        it('should accept passwords with sequential characters', () => {
            const result = PasswordValidator.validatePassword('Password123abc!');
            expect(result.isValid).toBe(true);
        });

        it('should accept strong password', () => {
            const result = PasswordValidator.validatePassword('StrongP@ssw0rd!');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.strength).toBe('strong');
        });

        it('should classify password strength correctly', () => {
            const weakResult = PasswordValidator.validatePassword('Password1!');
            expect(weakResult.strength).toBe('weak');

            const mediumResult = PasswordValidator.validatePassword('Password123!');
            expect(mediumResult.strength).toBe('medium');

            const strongResult = PasswordValidator.validatePassword('StrongP@ssw0rd!');
            expect(strongResult.strength).toBe('strong');
        });
    });

    describe('getPasswordRequirements', () => {
        it('should return array of requirements', () => {
            const requirements = PasswordValidator.getPasswordRequirements();
            expect(Array.isArray(requirements)).toBe(true);
            expect(requirements.length).toBeGreaterThan(0);
            expect(requirements[0]).toContain('At least 8 characters');
        });
    });
});
