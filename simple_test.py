#!/usr/bin/env python3
try:
    from database import engine
    print('✅ database import works')
except Exception as e:
    print(f'❌ database import failed: {e}')

try:
    from models import Quotation
    print('✅ models import works')
except Exception as e:
    print(f'❌ models import failed: {e}')

try:
    from schemas import SplitFulfillmentRequest
    print('✅ schemas import works')
except Exception as e:
    print(f'❌ schemas import failed: {e}')