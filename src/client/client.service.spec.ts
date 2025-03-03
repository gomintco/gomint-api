import { ClientService } from './client.service';
import { TestBed } from '@suites/unit';

describe('ClientService', () => {
  let service: ClientService;

  beforeEach(async () => {
    const { unit } = await TestBed.solitary(ClientService).compile();
    service = unit;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
