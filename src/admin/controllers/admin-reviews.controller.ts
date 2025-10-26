import {
    Controller,
    Delete,
    Param,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { ReviewsService } from 'src/reviews/reviews.service';
import { Role } from 'src/users/types/roles.enum';

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a review' })
    public async deleteReview(
        @Param('id', new ParseUUIDPipe({ version: '4' })) id: string
    ): Promise<void> {
        await this.reviewsService.delete(id);
    }
}
