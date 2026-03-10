from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import MarketForecast, CompanyAssumption, AuditLog
from .serializers import MarketDataSerializer, CompanyAssumptionSerializer, AuditLogSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_me(request):
    # Returns current user context for the frontend
    return Response({
        "username": request.user.username,
        "role": request.user.role,
        "company_name": request.user.company.name if request.user.company else None
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_market_data(request):
    data = MarketForecast.objects.all().order_by('date')
    return Response(MarketDataSerializer(data, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_company_prices(request):
    # EXPOSED API for Monthly Reports & other screens
    active = CompanyAssumption.objects.filter(company=request.user.company, status='ACTIVE')
    price_map = {item.period: float(item.price) for item in active}
    return Response(price_map)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def company_assumptions_view(request):
    company = request.user.company

    if request.method == 'GET':
        active = CompanyAssumption.objects.filter(company=company, status='ACTIVE')
        pending = CompanyAssumption.objects.filter(company=company, status='PENDING')
        
        return Response({
            'active': CompanyAssumptionSerializer(active, many=True).data,
            'pending': CompanyAssumptionSerializer(pending, many=True).data if request.user.role == 'ADMIN' else []
        })

    if request.method == 'POST':
        data = request.data # Expects array: [{"period": "2026-Q1", "price": 85.5}, ...]
        target_status = 'ACTIVE' if request.user.role == 'ADMIN' else 'PENDING'

        for item in data:
            period = item.get('period')
            price = item.get('price')

            # Clean up old pending requests for this period
            CompanyAssumption.objects.filter(company=company, period=period, status='PENDING').delete()
            
            # If Admin is bypassing approval, delete the old active price
            if target_status == 'ACTIVE':
                CompanyAssumption.objects.filter(company=company, period=period, status='ACTIVE').delete()

            CompanyAssumption.objects.create(
                company=company, period=period, price=price, 
                status=target_status, requested_by=request.user,
                approved_by=request.user if target_status == 'ACTIVE' else None
            )

        # Log it
        action = 'SAVED_ACTIVE' if target_status == 'ACTIVE' else 'SUBMITTED_DRAFT'
        AuditLog.objects.create(
            company=company, user=request.user, action=action,
            details=f"Submitted new prices for {len(data)} periods."
        )

        return Response({"message": "Saved successfully!"}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def review_assumption(request, assumption_id):
    """Admin Only Flow"""
    if request.user.role != 'ADMIN':
        return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
    
    action = request.data.get('action') # 'APPROVE' or 'REJECT'
    
    try:
        assumption = CompanyAssumption.objects.get(id=assumption_id, company=request.user.company, status='PENDING')
        
        if action == 'APPROVE':
            CompanyAssumption.objects.filter(company=assumption.company, period=assumption.period, status='ACTIVE').delete()
            assumption.status = 'ACTIVE'
            assumption.approved_by = request.user
            assumption.save()
            
            AuditLog.objects.create(company=assumption.company, user=request.user, action='APPROVED', details=f"Approved price for {assumption.period}")
            return Response({"message": "Approved"})
            
        elif action == 'REJECT':
            assumption.delete()
            AuditLog.objects.create(company=assumption.company, user=request.user, action='REJECTED', details=f"Rejected price for {assumption.period}")
            return Response({"message": "Rejected"})
            
    except CompanyAssumption.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_audit_logs(request):
    logs = AuditLog.objects.filter(company=request.user.company)[:50] # Get last 50
    return Response(AuditLogSerializer(logs, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rollover_year(request):
    # Automatic calling and takes the quater of the previous year and averages them.
    from datetime import date
    company = request.user.company
    prev_year = date.today().year - 1

    # Skip if rollover already done for this year
    if CompanyAssumption.objects.filter(company=company, period=str(prev_year), status='ACTIVE').exists():
        return Response({'rolled_over': False, 'reason': 'already_done'})

    # Find active quarterly assumptions for the previous year
    quarterly_periods = [f'{prev_year}-Q{q}' for q in range(1, 5)]
    quarterly = CompanyAssumption.objects.filter(
        company=company, period__in=quarterly_periods, status='ACTIVE'
    )

    if not quarterly.exists():
        return Response({'rolled_over': False, 'reason': 'no_quarterly_data'})

    prices = [float(a.price) for a in quarterly]
    avg_price = round(sum(prices) / len(prices), 2)

    _, created = CompanyAssumption.objects.get_or_create(
        company=company,
        period=str(prev_year),
        status='ACTIVE',
        defaults={
            'price': avg_price,
            'requested_by': request.user,
            'approved_by': request.user,
        },
    )

    if not created:
        return Response({'rolled_over': False, 'reason': 'already_done'})

    AuditLog.objects.create(
        company=company,
        user=request.user,
        action='YEAR_ROLLOVER',
        details=f"Averaged {len(prices)} quarterly prices for {prev_year} → €{avg_price}/t",
    )

    return Response({'rolled_over': True, 'year': prev_year, 'avg_price': avg_price})