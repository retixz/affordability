from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:3000", wait_until="domcontentloaded")
        expect(page.get_by_role("heading", name="Know they can pay. Instantly.")).to_be_visible()
        page.screenshot(path="/app/jules-scratch/verification/verification.png")
        print("Screenshot saved to /app/jules-scratch/verification/verification.png")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
