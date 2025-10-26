import { BadRequestException } from '@nestjs/common';

export function validateBirthDateRange(date: Date | string): void {
    if (!date) return;

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        throw new BadRequestException('birthDate must be a valid date');
    }

    const now = new Date();

    const minDate = new Date(
        now.getFullYear() - 118,
        now.getMonth(),
        now.getDate()
    );
    const maxDate = new Date(
        now.getFullYear() - 5,
        now.getMonth(),
        now.getDate()
    );

    if (parsedDate > maxDate) {
        throw new BadRequestException('birthDate must be at least 5 years ago');
    }

    if (parsedDate < minDate) {
        throw new BadRequestException(
            'birthDate must be less than 118 years ago'
        );
    }
}
