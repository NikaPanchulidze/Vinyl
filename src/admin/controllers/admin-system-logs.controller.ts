import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Role } from 'src/users/types/roles.enum';
import { SystemLogsService } from 'src/system-logs/system-logs.service';
import { QueryLogsDto } from 'src/system-logs/dtos/query-logs.dto';
import { LogsResponseDto } from 'src/system-logs/dtos/logs-reponse.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('admin/logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminLogsController {
    constructor(private readonly logsService: SystemLogsService) {}

    @Get('/')
    @ApiOperation({ summary: 'Get all system logs' })
    public findAll(@Query() query: QueryLogsDto): Promise<LogsResponseDto> {
        return this.logsService.getAll(query);
    }
}
