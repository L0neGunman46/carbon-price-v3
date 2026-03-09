from django.core.management.base import BaseCommand
from users.models import CustomUser, Company
from carbon_price.models import MarketForecast, CompanyAssumption, AuditLog
from datetime import date, timedelta
import random

class Command(BaseCommand):
    help = 'Seeds the database with multiple users, market data, assumptions, and audit logs'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Clearing existing database data..."))
        CustomUser.objects.all().delete()
        Company.objects.all().delete()
        MarketForecast.objects.all().delete()
        
        # 1. Create Company
        company = Company.objects.create(name="Deutsche Metallwerke")
        
        # 2. Create Multiple Users
        self.stdout.write("Creating Users...")
        
        # Admins
        admin1 = CustomUser.objects.create_user(
            username="sarah@cbamboo.com", email="sarah@cbamboo.com", password="password123", 
            first_name="Sarah", last_name="Connor", company=company, role="ADMIN"
        )
        admin2 = CustomUser.objects.create_user(
            username="michael@cbamboo.com", email="michael@cbamboo.com", password="password123", 
            first_name="Michael", last_name="Scott", company=company, role="ADMIN"
        )

        # Members
        member1 = CustomUser.objects.create_user(
            username="julia@cbamboo.com", email="julia@cbamboo.com", password="password123", 
            first_name="Julia", last_name="Bauer", company=company, role="MEMBER"
        )
        member2 = CustomUser.objects.create_user(
            username="mark@cbamboo.com", email="mark@cbamboo.com", password="password123", 
            first_name="Mark", last_name="Becker", company=company, role="MEMBER"
        )
        member3 = CustomUser.objects.create_user(
            username="lisa@cbamboo.com", email="lisa@cbamboo.com", password="password123", 
            first_name="Lisa", last_name="Muller", company=company, role="MEMBER"
        )

        # 3. Create Market Data (Historical & Forecasts)
        self.stdout.write("Generating Market Data...")
        current_date = date(2026, 1, 1)
        base_price = 82.0
        
        market_data_instances = []

        # Historical (Past 2 years)
        for i in range(730):
            d = current_date - timedelta(days=730-i)
            base_price += random.uniform(-0.8, 0.85)
            if base_price < 60: base_price = 60.0 
            market_data_instances.append(MarketForecast(source="historical", date=d, price=round(base_price, 2)))

        # Forecasts (10 years) — exact quarter-start dates so Jan ticks align
        quarter_months = [1, 4, 7, 10]
        analysts = {'analyst_bnef': 0.6, 'analyst_refinitiv': 0.1, 'analyst_internal': -0.3}
        for analyst, trend in analysts.items():
            price = base_price
            for quarter in range(40):
                year = current_date.year + quarter // 4
                month = quarter_months[quarter % 4]
                d = date(year, month, 1)
                price += trend + random.uniform(-1.5, 2.0)
                market_data_instances.append(MarketForecast(source=analyst, date=d, price=round(price, 2)))

        MarketForecast.objects.bulk_create(market_data_instances)

        # 4. Create Assumptions (Mixing users to make it realistic)
        self.stdout.write("Generating Assumptions and Audit Logs...")

        # 2025 Active assumptions (needed for year-rollover: avg = €83.75)
        CompanyAssumption.objects.create(
            company=company, period="2025-Q1", price=80.00, status="ACTIVE",
            requested_by=member2, approved_by=admin2
        )
        CompanyAssumption.objects.create(
            company=company, period="2025-Q2", price=82.50, status="ACTIVE",
            requested_by=admin1, approved_by=admin1
        )
        CompanyAssumption.objects.create(
            company=company, period="2025-Q3", price=85.00, status="ACTIVE",
            requested_by=member1, approved_by=admin2
        )
        CompanyAssumption.objects.create(
            company=company, period="2025-Q4", price=87.50, status="ACTIVE",
            requested_by=member2, approved_by=admin1
        )

        # Active Request 1: Mark requested, Michael (Admin) approved
        CompanyAssumption.objects.create(
            company=company, period="2026-Q1", price=84.00, status="ACTIVE",
            requested_by=member2, approved_by=admin2
        )
        
        # Active Request 2: Sarah (Admin) just bypassed review and set this herself
        CompanyAssumption.objects.create(
            company=company, period="2026-Q2", price=86.50, status="ACTIVE",
            requested_by=admin1, approved_by=admin1
        )

        # Pending Request 1: Julia wants to update Q3
        CompanyAssumption.objects.create(
            company=company, period="2026-Q3", price=88.00, status="PENDING",
            requested_by=member1
        )
        
        # Pending Request 2: Lisa wants to update 2027
        CompanyAssumption.objects.create(
            company=company, period="2027", price=92.50, status="PENDING",
            requested_by=member3
        )

        # 5. Populate the Audit Log
        # 2025 audit entries
        AuditLog.objects.create(company=company, user=member2, action="SUBMITTED_DRAFT", details="Mark Becker requested to set 2025-Q1 price to €80.00")
        AuditLog.objects.create(company=company, user=admin2, action="APPROVED", details="Michael Scott approved 2025-Q1 price at €80.00")
        AuditLog.objects.create(company=company, user=member1, action="SUBMITTED_DRAFT", details="Julia Bauer requested to set 2025-Q3 price to €85.00")
        AuditLog.objects.create(company=company, user=admin1, action="APPROVED", details="Sarah Connor approved 2025-Q3 price at €85.00")
        # 2026 audit entries
        AuditLog.objects.create(company=company, user=member2, action="SUBMITTED_DRAFT", details="Mark Becker requested to set 2026-Q1 price to €84.00")
        AuditLog.objects.create(company=company, user=admin2, action="APPROVED", details="Michael Scott approved 2026-Q1 price at €84.00")
        AuditLog.objects.create(company=company, user=admin1, action="SAVED_ACTIVE", details="Sarah Connor directly set active price for 2026-Q2 to €86.50")
        AuditLog.objects.create(company=company, user=member1, action="SUBMITTED_DRAFT", details="Julia Bauer requested to set 2026-Q3 price to €88.00")
        AuditLog.objects.create(company=company, user=member3, action="SUBMITTED_DRAFT", details="Lisa Muller requested to set 2027 price to €92.50")

        self.stdout.write(self.style.SUCCESS("✅ Database perfectly seeded with multiple users!"))
        self.stdout.write("-------------------------------------------------")
        self.stdout.write(self.style.WARNING("🏢 Company: Deutsche Metallwerke"))
        self.stdout.write(self.style.SUCCESS("\n👑 ADMIN ACCOUNTS (Can approve prices):"))
        self.stdout.write("  - sarah@cbamboo.com / password123")
        self.stdout.write("  - michael@cbamboo.com / password123")
        self.stdout.write(self.style.SUCCESS("\n👥 MEMBER ACCOUNTS (Can only submit drafts):"))
        self.stdout.write("  - julia@cbamboo.com / password123")
        self.stdout.write("  - mark@cbamboo.com / password123")
        self.stdout.write("  - lisa@cbamboo.com / password123")
        self.stdout.write("-------------------------------------------------")