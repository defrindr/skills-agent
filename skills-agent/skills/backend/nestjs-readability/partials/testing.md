---
name: nestjs-readability/testing
---

## Testing

```ts
describe('OrdersService', () => {
  it('throws NOT_FOUND when order does not exist', async () => {
    const repo = { findById: vi.fn().mockResolvedValue(null) }
    const service = new OrdersService(repo as any)

    await expect(service.cancelOrder('order-1')).rejects.toThrow(AppError)
    expect(repo.findById).toHaveBeenCalledWith('order-1')
  })

  it('throws CONFLICT when order already shipped', async () => {
    const repo = { findById: vi.fn().mockResolvedValue({ status: 'shipped' }) }
    const service = new OrdersService(repo as any)

    await expect(service.cancelOrder('order-1')).rejects.toThrow(AppError)
  })
})
```
