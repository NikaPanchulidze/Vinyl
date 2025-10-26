import { Transform, TransformFnParams } from 'class-transformer';

export function TrimString() {
    return Transform(({ value }: TransformFnParams): unknown =>
        typeof value === 'string' ? value.trim() : value
    );
}
